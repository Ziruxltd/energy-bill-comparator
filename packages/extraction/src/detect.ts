import type Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { outputText, pdfBlock, usageOf, type StepUsage } from "./claude";
import { ExtractionError } from "./errors";

export const Detection = z.object({ kind: z.enum(["electricity", "gas", "not_a_bill"]) });
export type Detection = z.infer<typeof Detection>;

const DETECTION_PROMPT = `Is this document a Spanish household energy bill?
Answer "electricity" for an electricity bill, "gas" for a natural gas bill, or "not_a_bill" for anything else.
A bill that charges both electricity and gas is "gas" (dual-fuel bills are not supported).`;

/** Cheap first call: rejects non-bills and unsupported energy types before the expensive extraction. */
export const detectEnergyType = async (
  client: Anthropic,
  model: string,
  pdfBase64: string,
): Promise<{ detection: Detection; usage: StepUsage }> => {
  const response = await client.messages.create({
    model,
    max_tokens: 2000,
    output_config: { effort: "low", format: zodOutputFormat(Detection) },
    messages: [
      { role: "user", content: [pdfBlock(pdfBase64), { type: "text", text: DETECTION_PROMPT }] },
    ],
  });
  const parsed = Detection.safeParse(safeJson(outputText(response)));
  if (!parsed.success) throw new ExtractionError("invalid_output", "detection output");
  return { detection: parsed.data, usage: usageOf("detection", model, response) };
};

export const safeJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};
