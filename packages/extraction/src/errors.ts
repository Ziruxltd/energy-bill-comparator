export type ExtractionErrorCode =
  | "not_pdf"
  | "too_large"
  | "too_many_tokens"
  | "not_a_bill"
  | "unsupported_energy"
  | "refusal"
  | "truncated"
  | "invalid_output";

/** Every expected failure has a code the UI can translate. The message never contains bill contents. */
export class ExtractionError extends Error {
  constructor(
    readonly code: ExtractionErrorCode,
    message: string = code,
  ) {
    super(message);
    this.name = "ExtractionError";
  }
}
