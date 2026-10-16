import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import { energyLine } from "../../src/electricity/energy";

const periods = (p1: string, p2: string, p3: string) => ({
  p1: new Decimal(p1),
  p2: new Decimal(p2),
  p3: new Decimal(p3),
});

describe("energyLine", () => {
  it("rounds the sum once, not each period (19.12, not 19.13)", () => {
    const price = "0.1099";
    expect(energyLine(periods("41", "38", "95"), periods(price, price, price)).toFixed(2)).toBe(
      "19.12",
    );
  });

  it("applies a different price per period", () => {
    // 10 × 0.2 + 20 × 0.15 + 30 × 0.1 = 8
    expect(energyLine(periods("10", "20", "30"), periods("0.2", "0.15", "0.1")).toFixed(2)).toBe(
      "8.00",
    );
  });
});
