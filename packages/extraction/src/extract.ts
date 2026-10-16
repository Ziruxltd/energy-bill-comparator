import type Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ElectricityBill } from "@ebc/core";
import { outputText, pdfBlock, usageOf, type StepUsage } from "./claude";
import type { ExtractionConfig } from "./config";
import { detectEnergyType, safeJson } from "./detect";
import { ELECTRICITY_EXTRACTION_PROMPT } from "./electricity/prompt";
import { ExtractionError } from "./errors";

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"

/** Free checks first: nothing reaches a paid call unless it is a PDF of acceptable size. */
export const assertPdf = (pdf: Uint8Array, maxBytes: number): void => {
  if (pdf.length > maxBytes) throw new ExtractionError("too_large");
  if (!PDF_MAGIC.every((byte, index) => pdf[index] === byte)) throw new ExtractionError("not_pdf");
};

// The SDK moves unsupported constraints (decimal regex) into descriptions; the strict parse below enforces them.
const electricityFormat = zodOutputFormat(ElectricityBill);

const extractElectricity = async (
  client: Anthropic,
  model: string,
  pdfBase64: string,
): Promise<{ bill: ElectricityBill | null; usage: StepUsage }> => {
  const response = await client.messages.create({
    model,
    max_tokens: 16000,
    // TODO: tune effort with evals (phase 5).
    output_config: { effort: "medium", format: electricityFormat },
    system: ELECTRICITY_EXTRACTION_PROMPT,
    messages: [{ role: "user", content: [pdfBlock(pdfBase64)] }],
  });
  const parsed = ElectricityBill.safeParse(safeJson(outputText(response)));
  return {
    bill: parsed.success ? parsed.data : null,
    usage: usageOf("extraction", model, response),
  };
};

export interface ExtractionResult {
  bill: ElectricityBill;
  /** Logged per request by the caller; never the bill contents. */
  usage: StepUsage[];
}

/** PDF → validated ElectricityBill: free checks → token count → detection → extraction (one same-model retry). */
export const extractBill = async (
  client: Anthropic,
  config: ExtractionConfig,
  pdf: Uint8Array,
): Promise<ExtractionResult> => {
  assertPdf(pdf, config.maxPdfBytes);
  const pdfBase64 = Buffer.from(pdf).toString("base64");

  const { input_tokens: inputTokens } = await client.messages.countTokens({
    model: config.extractionModel,
    messages: [{ role: "user", content: [pdfBlock(pdfBase64)] }],
  });
  if (inputTokens > config.maxInputTokens) throw new ExtractionError("too_many_tokens");

  const { detection, usage: detectionUsage } = await detectEnergyType(
    client,
    config.detectionModel,
    pdfBase64,
  );
  if (detection.kind === "not_a_bill") throw new ExtractionError("not_a_bill");
  if (detection.kind === "gas") throw new ExtractionError("unsupported_energy");

  const usage = [detectionUsage];
  // One retry, same model: no fallback to a different or more expensive model (CLAUDE.md, cost control).
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await extractElectricity(client, config.extractionModel, pdfBase64);
    usage.push(result.usage);
    if (result.bill) return { bill: result.bill, usage };
  }
  throw new ExtractionError("invalid_output", "extraction output failed validation twice");
};
