/**
 * Masks identifiers with a fixed format before anything is logged. It can't find names or addresses
 * (no fixed format), so the real protection is the rule: never log bill contents, only codes,
 * Zod issue paths and token usage (v1-plan R7).
 */
const PATTERNS: readonly [RegExp, string][] = [
  [/\bES\s?\d{2}(?:\s?\d{4}){5}\b/gi, "[IBAN]"],
  [/\bES\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?[A-Z]{2}(?:\s?\d[A-Z])?\b/gi, "[CUPS]"],
  [/\b[XYZ]\d{7}[A-Z]\b/gi, "[NIE]"],
  [/\b\d{8}[A-Z]\b/gi, "[DNI]"],
  [/\b[\w.+-]+@[\w-]+\.[\w.]+\b/g, "[EMAIL]"],
  [/(?:\+34\s?)?\b[6789]\d{2}\s?\d{3}\s?\d{3}\b/g, "[PHONE]"],
];

export const redact = (text: string): string =>
  PATTERNS.reduce((masked, [pattern, label]) => masked.replace(pattern, label), text);
