import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import { vatAmount } from "../../src/shared/vat";

const d = (value: string) => new Decimal(value);
// Test-only rate. Real rates live in each energy type's tax-rates.ts with source and date.
const RATE = d("0.21");

describe("vatAmount", () => {
  it("applies the rate to the base", () => {
    expect(vatAmount(d("100.00"), RATE).toFixed(2)).toBe("21.00");
  });

  it("rounds the result half up to cents", () => {
    // 0.50 × 0.21 = 0.105
    expect(vatAmount(d("0.50"), RATE).toFixed(2)).toBe("0.11");
    // 10.05 × 0.21 = 2.1105
    expect(vatAmount(d("10.05"), RATE).toFixed(2)).toBe("2.11");
  });

  it("is zero on a zero base", () => {
    expect(vatAmount(d("0"), RATE).isZero()).toBe(true);
  });
});
