import type Anthropic from "@anthropic-ai/sdk";
import { ExtractionError } from "./errors";

export interface StepUsage {
  step: "detection" | "extraction";
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export const pdfBlock = (pdfBase64: string): Anthropic.DocumentBlockParam => ({
  type: "document",
  source: { type: "base64", media_type: "application/pdf", data: pdfBase64 },
});

/**
 * Checks why the model stopped before reading its output: a refusal or a cut-off response
 * won't match the schema, and must reach the user as its own error (v1-plan R6). No fallback model, by rule.
 */
export const outputText = (response: Anthropic.Message): string => {
  if (response.stop_reason === "refusal") throw new ExtractionError("refusal");
  if (response.stop_reason === "max_tokens") throw new ExtractionError("truncated");
  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
};

export const usageOf = (
  step: StepUsage["step"],
  model: string,
  response: Anthropic.Message,
): StepUsage => ({
  step,
  model,
  inputTokens: response.usage.input_tokens,
  outputTokens: response.usage.output_tokens,
});
