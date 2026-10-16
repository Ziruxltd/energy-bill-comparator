import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import { compareTariffs, crossCheck } from "../src/compare";
import type { ElectricityTariffTerms } from "../src/electricity/schema";
import { goldenElectricityBill } from "./fixtures/golden-electricity-bill";

const tariff = (name: string, energyEurPerKwh: string) =>
  ({
    name,
    prices: {
      powerEurPerKwDay: { p1: "0.108192", p2: "0.057507" },
      energyEurPerKwh: { p1: energyEurPerKwh, p2: energyEurPerKwh, p3: energyEurPerKwh },
    },
    discounts: [],
  }) satisfies ElectricityTariffTerms & { name: string };

describe("crossCheck", () => {
  const printed = new Decimal("100.00");

  it("matches within 2%", () => {
    expect(crossCheck(new Decimal("101.50"), printed).status).toBe("match");
  });

  it("flags a gap above 2%", () => {
    expect(crossCheck(new Decimal("102.50"), printed).status).toBe("mismatch");
  });

  it("is unavailable without both totals", () => {
    expect(crossCheck(null, printed).status).toBe("unavailable");
    expect(crossCheck(printed, null).status).toBe("unavailable");
  });
});

describe("compareTariffs", () => {
  it("ranks cheapest first with savings against the bill's own recalculation", () => {
    const result = compareTariffs(goldenElectricityBill, [
      tariff("expensive", "0.2000"),
      tariff("cheap", "0.0999"),
      tariff("same", "0.1099"),
    ]);
    if (!result.ok) throw new Error(result.missingFields.join());
    expect(result.crossCheck.status).toBe("match");
    expect(result.offers.map((offer) => offer.tariff.name)).toEqual(["cheap", "same", "expensive"]);
    const [cheap, same] = result.offers;
    expect(same?.savingsEur?.toFixed(2)).toBe("0.00");
    // 72.29 − 70.07 (energy 17.38, electricity tax 2.16, VAT 12.16)
    expect(cheap?.savingsEur?.toFixed(2)).toBe("2.22");
    // 2.22 / 33 days × 365
    expect(cheap?.annualSavingsEur?.toFixed(2)).toBe("24.55");
  });

  it("falls back to the printed total when the bill's prices are missing", () => {
    const bill = {
      ...goldenElectricityBill,
      prices: {
        ...goldenElectricityBill.prices,
        energyEurPerKwh: { p1: null, p2: null, p3: null },
      },
    };
    const result = compareTariffs(bill, [tariff("same", "0.1099")]);
    if (!result.ok) throw new Error(result.missingFields.join());
    expect(result.current).toBeNull();
    expect(result.crossCheck.status).toBe("unavailable");
    expect(result.offers[0]?.savingsEur?.toFixed(2)).toBe("0.00");
  });

  it("returns the missing fields when the bill can't be recalculated", () => {
    const bill = { ...goldenElectricityBill, meterRentalEur: null };
    expect(compareTariffs(bill, [tariff("same", "0.1099")])).toEqual({
      ok: false,
      missingFields: ["meterRentalEur"],
    });
  });
});
