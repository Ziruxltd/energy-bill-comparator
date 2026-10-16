import type { ElectricityBill } from "../../src/electricity/schema";

// Fictional bill for schema tests. Not real prices or a real customer.
export const validElectricityBill: ElectricityBill = {
  energyType: "electricity",
  retailer: "Example Energía",
  tariffName: "Tarifa Fija Ejemplo",
  billingPeriod: { startDate: "2026-08-01", endDate: "2026-08-31", days: 31 },
  discounts: [{ description: "Descuento bienvenida", amountEur: "5.00" }],
  totalAmountEur: "78.42",
  contractedPowerKw: { p1: "4.6", p2: "4.6" },
  consumptionKwh: { p1: "80", p2: "70", p3: "120" },
  prices: {
    powerEurPerKwDay: { p1: "0.100000", p2: "0.030000" },
    energyEurPerKwh: { p1: "0.200000", p2: "0.150000", p3: "0.100000" },
  },
  socialBonusFinancingEur: "0.77",
  meterRentalEur: "0.81",
  otherServices: [],
  confidence: {
    retailer: "high",
    tariffName: "medium",
    billingPeriod: "high",
    discounts: "high",
    totalAmountEur: "high",
    contractedPowerKw: "high",
    consumptionKwh: "high",
    prices: "low",
    socialBonusFinancingEur: "high",
    meterRentalEur: "medium",
    otherServices: "high",
  },
};
