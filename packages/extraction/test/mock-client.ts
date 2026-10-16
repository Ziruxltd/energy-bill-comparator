import type Anthropic from "@anthropic-ai/sdk";
import { vi } from "vitest";

/** A fake SDK response: only the fields the extraction code reads. */
export const message = (
  text: string,
  stopReason: Anthropic.StopReason = "end_turn",
): Anthropic.Message =>
  ({
    content: [{ type: "text", text, citations: null }],
    stop_reason: stopReason,
    usage: { input_tokens: 1000, output_tokens: 200 },
  }) as unknown as Anthropic.Message;

/** Client whose messages.create returns the given responses in order. */
export const mockClient = (responses: Anthropic.Message[], inputTokens = 5000) => {
  const create = vi.fn();
  for (const response of responses) create.mockResolvedValueOnce(response);
  const countTokens = vi.fn().mockResolvedValue({ input_tokens: inputTokens });
  const client = { messages: { create, countTokens } } as unknown as Anthropic;
  return { client, create, countTokens };
};

export const pdfBytes = new TextEncoder().encode("%PDF-1.7 fake");
