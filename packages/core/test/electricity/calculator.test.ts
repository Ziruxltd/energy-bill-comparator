import { describe, expect, it } from "vitest";
import { electricityCalculator } from "../../src/electricity/calculator";
import { goldenElectricityBill } from "../fixtures/golden-electricity-bill";

const ownTariff = () => {
  const tariff = electricityCalculator.currentTariff(goldenElectricityBill);
  if (!tariff) throw new Error("golden bill must have prices");
  return tariff;
};

describe("electricityCalculator", () => {
  it("recalculates a real bill line by line to its printed total", () => {
    const result = electricityCalculator.calculateBill(goldenElectricityBill, ownTariff());
    if (!result.ok) throw new Error(result.missingFields.join());
    const lines = Object.fromEntries(
      result.breakdown.lines.map((line) => [line.concept, line.amountEur.toFixed(2)]),
    );
    expect(lines).toEqual({
      powerP1: "15.71",
      powerP2: "8.35",
      energy: "19.12",
      socialBonusFinancing: "0.81",
      electricityTax: "2.25",
      meterRental: "0.88",
      otherServices: "12.62",
      vat: "12.55",
    });
    expect(result.breakdown.totalEur.toFixed(2)).toBe("72.29");
  });

  it("subtracts the tariff's discounts before the electricity tax", () => {
    const tariff = { ...ownTariff(), discounts: [{ description: "Promo", amountEur: "10.00" }] };
    const result = electricityCalculator.calculateBill(goldenElectricityBill, tariff);
    if (!result.ok) throw new Error(result.missingFields.join());
    const tax = result.breakdown.lines.find((line) => line.concept === "electricityTax");
    // (43.99 − 10) × 0.0511269632 = 1.7378
    expect(tax?.amountEur.toFixed(2)).toBe("1.74");
  });

  it("omits the services line when the bill has none", () => {
    const bill = { ...goldenElectricityBill, otherServicesEur: null };
    const result = electricityCalculator.calculateBill(bill, ownTariff());
    expect(result.ok && result.breakdown.lines.map((line) => line.concept)).not.toContain(
      "otherServices",
    );
  });

  it("lists every missing required field", () => {
    const bill = {
      ...goldenElectricityBill,
      billingPeriod: { ...goldenElectricityBill.billingPeriod, days: null },
      consumptionKwh: { ...goldenElectricityBill.consumptionKwh, p3: null },
      meterRentalEur: null,
    };
    expect(electricityCalculator.calculateBill(bill, ownTariff())).toEqual({
      ok: false,
      missingFields: ["billingPeriod.days", "consumptionKwh.p3", "meterRentalEur"],
    });
  });

  it("builds the current tariff from the bill, with the bill's discounts", () => {
    const bill = {
      ...goldenElectricityBill,
      discounts: [{ description: "Promo", amountEur: "5.00" }],
    };
    expect(electricityCalculator.currentTariff(bill)?.discounts).toEqual(bill.discounts);
  });

  it("has no current tariff when a price is missing", () => {
    const bill = {
      ...goldenElectricityBill,
      prices: {
        ...goldenElectricityBill.prices,
        energyEurPerKwh: { ...goldenElectricityBill.prices.energyEurPerKwh, p2: null },
      },
    };
    expect(electricityCalculator.currentTariff(bill)).toBeNull();
  });
});
