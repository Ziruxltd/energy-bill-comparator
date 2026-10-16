import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import { powerLine } from "../../src/electricity/power";

describe("powerLine", () => {
  it("multiplies kW × €/kW·day × days and rounds to cents", () => {
    // 4.4 × 0.108192 × 33 = 15.7094784
    expect(powerLine(new Decimal("4.4"), new Decimal("0.108192"), new Decimal(33)).toFixed(2)).toBe(
      "15.71",
    );
  });

  it("rounds half up", () => {
    expect(powerLine(new Decimal(1), new Decimal("0.005"), new Decimal(1)).toFixed(2)).toBe("0.01");
  });
});
