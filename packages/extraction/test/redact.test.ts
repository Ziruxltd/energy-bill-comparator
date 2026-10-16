import { describe, expect, it } from "vitest";
import { redact } from "../src/redact";

// Made-up identifiers in the real formats.
describe("redact", () => {
  it.each([
    ["IBAN ES12 3456 7890 1234 5678 9012", "IBAN [IBAN]"],
    ["CUPS ES 0021 0000 0123 4567 AB", "CUPS [CUPS]"],
    ["CUPS ES0021000001234567AB1F", "CUPS [CUPS]"],
    ["NIF 12345678Z", "NIF [DNI]"],
    ["NIE X1234567L", "NIE [NIE]"],
    ["mail ana@example.com", "mail [EMAIL]"],
    ["tel 612 345 678", "tel [PHONE]"],
  ])("masks %s", (input, expected) => {
    expect(redact(input)).toBe(expected);
  });

  it("leaves prices, kWh and dates alone", () => {
    const text = "174 kWh x 0,1099 €/kWh = 19,12 € on 2026-08-24";
    expect(redact(text)).toBe(text);
  });
});
