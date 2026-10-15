import Decimal from "decimal.js";
import { describe, expect, expectTypeOf, it } from "vitest";
import type { ElectricityBill } from "../../src/electricity/schema";
import type { CalculationResult, EnergyCalculator } from "../../src/shared/calculator";
import { validElectricityBill } from "../fixtures/electricity-bill";

interface StubTariff {
  flatEur: string;
}

// Minimal implementation: proves the interface is implementable and pins its shape.
const stubCalculator: EnergyCalculator<ElectricityBill, StubTariff> = {
  energyType: "electricity",
  calculateBill: (bill, tariff) =>
    bill.consumptionKwh.p1 === null
      ? { ok: false, missingFields: ["consumptionKwh.p1"] }
      : {
          ok: true,
          breakdown: {
            lines: [{ concept: "flat", amountEur: new Decimal(tariff.flatEur) }],
            totalEur: new Decimal(tariff.flatEur),
          },
        },
};

describe("EnergyCalculator", () => {
  it("returns a breakdown when the bill has enough data", () => {
    const result = stubCalculator.calculateBill(validElectricityBill, { flatEur: "10.00" });
    expect(result.ok && result.breakdown.totalEur.toFixed(2)).toBe("10.00");
  });

  it("names the missing fields instead of guessing", () => {
    const bill = { ...validElectricityBill, consumptionKwh: { p1: null, p2: "1", p3: "1" } };
    expect(stubCalculator.calculateBill(bill, { flatEur: "10.00" })).toEqual({
      ok: false,
      missingFields: ["consumptionKwh.p1"],
    });
  });

  it("ties energyType to the bill type it calculates", () => {
    expectTypeOf(stubCalculator.energyType).toEqualTypeOf<"electricity">();
    expectTypeOf(stubCalculator.calculateBill).returns.toEqualTypeOf<CalculationResult>();
  });
});
