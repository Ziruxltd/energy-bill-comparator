import { describe, expect, it } from "vitest";
import { ExtractedBill } from "../src/extracted-bill";
import { validElectricityBill } from "./fixtures/electricity-bill";

describe("ExtractedBill", () => {
  it("parses a complete electricity bill", () => {
    const result = ExtractedBill.safeParse(validElectricityBill);
    expect(result.success).toBe(true);
    expect(result.data?.energyType).toBe("electricity");
  });

  it("accepts null for every field not found, and an empty discount list", () => {
    const bill = {
      energyType: "electricity",
      retailer: null,
      tariffName: null,
      billingPeriod: { startDate: null, endDate: null, days: null },
      discounts: [],
      totalAmountEur: null,
      contractedPowerKw: { p1: null, p2: null },
      consumptionKwh: { p1: null, p2: null, p3: null },
      prices: {
        powerEurPerKwDay: { p1: null, p2: null },
        energyEurPerKwh: { p1: null, p2: null, p3: null },
      },
      meterRentalEur: null,
      confidence: validElectricityBill.confidence,
    };
    expect(ExtractedBill.safeParse(bill).success).toBe(true);
  });

  it("rejects an energy type that isn't registered", () => {
    const bill = { ...validElectricityBill, energyType: "water" };
    expect(ExtractedBill.safeParse(bill).success).toBe(false);
  });

  it("rejects an amount given as a JSON number", () => {
    const bill = { ...validElectricityBill, totalAmountEur: 78.42 };
    expect(ExtractedBill.safeParse(bill).success).toBe(false);
  });

  it("rejects a missing confidence key", () => {
    const confidence: Record<string, unknown> = { ...validElectricityBill.confidence };
    delete confidence.prices;
    const bill = { ...validElectricityBill, confidence };
    expect(ExtractedBill.safeParse(bill).success).toBe(false);
  });

  it("rejects an unknown confidence level", () => {
    const confidence = { ...validElectricityBill.confidence, prices: "certain" };
    const bill = { ...validElectricityBill, confidence };
    expect(ExtractedBill.safeParse(bill).success).toBe(false);
  });

  it("rejects a missing field instead of treating it as null", () => {
    const bill: Record<string, unknown> = { ...validElectricityBill };
    delete bill.meterRentalEur;
    expect(ExtractedBill.safeParse(bill).success).toBe(false);
  });
});
