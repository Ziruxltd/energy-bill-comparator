import type { ElectricityBill } from "../../src/electricity/schema";

/**
 * Numbers from a real Iberdrola 2.0TD bill (22/07–24/08/2026), typed by hand.
 * No personal data: name, address, CUPS, NIF, IBAN and contract number are left out.
 * Printed lines: power 15.71 + 8.35, energy 19.12, social bonus 0.81, electricity tax 2.25,
 * meter rental 0.88, services 12.62, VAT 12.55, total 72.29.
 */
export const goldenElectricityBill: ElectricityBill = {
  energyType: "electricity",
  retailer: "Iberdrola",
  tariffName: null,
  billingPeriod: { startDate: "2026-07-22", endDate: "2026-08-24", days: 33 },
  discounts: [],
  totalAmountEur: "72.29",
  contractedPowerKw: { p1: "4.4", p2: "4.4" },
  consumptionKwh: { p1: "41", p2: "38", p3: "95" },
  prices: {
    powerEurPerKwDay: { p1: "0.108192", p2: "0.057507" },
    energyEurPerKwh: { p1: "0.1099", p2: "0.1099", p3: "0.1099" },
  },
  socialBonusFinancingEur: "0.81",
  meterRentalEur: "0.88",
  otherServices: [
    { description: "Asistente Smart Iberdrola", amountEur: "3.13" },
    { description: "Protección Eléctrica Hogar Plus", amountEur: "9.49" },
  ],
  confidence: {
    retailer: "high",
    tariffName: "low",
    billingPeriod: "high",
    discounts: "high",
    totalAmountEur: "high",
    contractedPowerKw: "high",
    consumptionKwh: "high",
    prices: "high",
    socialBonusFinancingEur: "high",
    meterRentalEur: "high",
    otherServices: "high",
  },
};
