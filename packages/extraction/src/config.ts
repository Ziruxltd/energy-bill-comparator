// The only file that reads process.env. detect.ts and extract.ts take models as parameters so evals can inject them.

const env = (name: string, fallback: string): string => process.env[name] || fallback;

export const extractionConfig = {
  detectionModel: env("ANTHROPIC_MODEL_DETECTION", "claude-haiku-5-5"),
  extractionModel: env("ANTHROPIC_MODEL_EXTRACTION", "claude-sonnet-5-5"),
  /** Netlify buffers ~4.5 MB of base64-encoded binary; 4 MB leaves headroom (v1-plan R2). */
  maxPdfBytes: 4 * 1024 * 1024,
  /** Tokens are what cost money, so the page limit is a token limit (v1-plan R3). Re-measure in phase 5. */
  maxInputTokens: 20_000,
} as const;

export type ExtractionConfig = typeof extractionConfig;
