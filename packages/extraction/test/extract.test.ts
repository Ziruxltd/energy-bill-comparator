import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ElectricityBill } from "@ebc/core";
import { describe, expect, it } from "vitest";
import { goldenElectricityBill as goldenBill } from "../../core/test/fixtures/golden-electricity-bill";
import type { ExtractionConfig } from "../src/config";
import { ExtractionError } from "../src/errors";
import { assertPdf, extractBill } from "../src/extract";
import { message, mockClient, pdfBytes } from "./mock-client";

const config: ExtractionConfig = {
  detectionModel: "detect-model",
  extractionModel: "extract-model",
  maxPdfBytes: 1024,
  maxInputTokens: 20_000,
};
const detected = (kind: string) => message(JSON.stringify({ kind }));
const billJson = JSON.stringify(goldenBill);

const errorCode = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ExtractionError) return error.code;
    throw error;
  }
  throw new Error("expected an ExtractionError");
};

describe("assertPdf", () => {
  it("rejects bytes that aren't a PDF", () => {
    expect(() => assertPdf(new TextEncoder().encode("hello"), 1024)).toThrow("not_pdf");
  });

  it("rejects a file over the size limit", () => {
    expect(() => assertPdf(new Uint8Array(2048), 1024)).toThrow("too_large");
  });
});

describe("extractBill", () => {
  it("returns the validated bill and the usage of each call", async () => {
    const { client, create } = mockClient([detected("electricity"), message(billJson)]);
    const result = await extractBill(client, config, pdfBytes);
    expect(result.bill.totalAmountEur).toBe("72.29");
    expect(result.usage.map((usage) => [usage.step, usage.model])).toEqual([
      ["detection", "detect-model"],
      ["extraction", "extract-model"],
    ]);
    expect(create).toHaveBeenCalledTimes(2);
  });

  it("never calls Claude for a file that isn't a PDF", async () => {
    const { client, create, countTokens } = mockClient([]);
    expect(await errorCode(extractBill(client, config, new Uint8Array([1, 2, 3])))).toBe("not_pdf");
    expect(countTokens).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it("stops after the free token count when the PDF is too big", async () => {
    const { client, create } = mockClient([], 25_000);
    expect(await errorCode(extractBill(client, config, pdfBytes))).toBe("too_many_tokens");
    expect(create).not.toHaveBeenCalled();
  });

  it.each([
    ["not_a_bill", "not_a_bill"],
    ["gas", "unsupported_energy"],
  ])("stops after detection for %s", async (kind, code) => {
    const { client, create } = mockClient([detected(kind)]);
    expect(await errorCode(extractBill(client, config, pdfBytes))).toBe(code);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("retries once on the same model when the output fails validation", async () => {
    const invalid = JSON.stringify({ ...goldenBill, totalAmountEur: "72,29" });
    const { client, create } = mockClient([
      detected("electricity"),
      message(invalid),
      message(billJson),
    ]);
    const result = await extractBill(client, config, pdfBytes);
    expect(result.bill.totalAmountEur).toBe("72.29");
    expect(create.mock.calls.map(([params]) => params.model)).toEqual([
      "detect-model",
      "extract-model",
      "extract-model",
    ]);
  });

  it("gives up after the retry", async () => {
    const { client } = mockClient([detected("electricity"), message("{}"), message("not json")]);
    expect(await errorCode(extractBill(client, config, pdfBytes))).toBe("invalid_output");
  });

  it.each([
    ["refusal", "refusal"],
    ["max_tokens", "truncated"],
  ] as const)("maps stop reason %s to %s without retrying", async (stopReason, code) => {
    const { client, create } = mockClient([detected("electricity"), message("", stopReason)]);
    expect(await errorCode(extractBill(client, config, pdfBytes))).toBe(code);
    expect(create).toHaveBeenCalledTimes(2);
  });
});

describe("structured output schema", () => {
  it("converts the core ElectricityBill schema without a separate output schema", () => {
    expect(() => zodOutputFormat(ElectricityBill)).not.toThrow();
  });
});
