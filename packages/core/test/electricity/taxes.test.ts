import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import { electricityTax } from "../../src/electricity/taxes";

describe("electricityTax", () => {
  it("applies the rate to the base", () => {
    // 43.99 × 0.0511269632 = 2.249...
    expect(electricityTax(new Decimal("43.99"), new Decimal(174)).toFixed(2)).toBe("2.25");
  });

  it("never goes below 1 €/MWh consumed", () => {
    // 1.00 × rate = 0.05, but 100 kWh × 0.001 = 0.10
    expect(electricityTax(new Decimal("1.00"), new Decimal(100)).toFixed(2)).toBe("0.10");
  });
});
