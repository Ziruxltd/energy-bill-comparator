import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import { roundToCents, sumAmounts } from "../../src/shared/money";

const d = (value: string) => new Decimal(value);

describe("roundToCents", () => {
  it("rounds half up, as Spanish bills are printed", () => {
    expect(roundToCents(d("0.005")).toFixed(2)).toBe("0.01");
    // Banker's rounding would give 0.02 for 0.025; half-up gives 0.03
    expect(roundToCents(d("0.025")).toFixed(2)).toBe("0.03");
  });

  it("rounds down below the half cent", () => {
    expect(roundToCents(d("1.0049")).toFixed(2)).toBe("1.00");
  });

  it("rounds negative amounts away from zero (discount lines)", () => {
    expect(roundToCents(d("-0.005")).toFixed(2)).toBe("-0.01");
  });

  it("keeps precision that floating point would lose", () => {
    // 1.005 is 1.00499999... as a JS number, so Math.round would give 1.00
    expect(roundToCents(d("1.005")).toFixed(2)).toBe("1.01");
  });
});

describe("sumAmounts", () => {
  it("sums exactly", () => {
    // 0.1 + 0.2 === 0.30000000000000004 with numbers
    expect(sumAmounts([d("0.1"), d("0.2")]).toString()).toBe("0.3");
  });

  it("returns zero for an empty list", () => {
    expect(sumAmounts([]).toString()).toBe("0");
  });
});
