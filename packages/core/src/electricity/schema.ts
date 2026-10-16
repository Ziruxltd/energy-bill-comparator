import { z } from "zod";
import {
  commonBillFields,
  commonConfidenceFields,
  ConfidenceLevel,
  DecimalString,
  Discount,
} from "../shared/schema";

const nullableDecimal = DecimalString.nullable();

/** 2.0TD: power has two periods (p1, p2), energy has three (p1, p2, p3). */
const PowerPeriods = z.object({ p1: nullableDecimal, p2: nullableDecimal });
const EnergyPeriods = z.object({ p1: nullableDecimal, p2: nullableDecimal, p3: nullableDecimal });

export const ElectricityBill = z.object({
  energyType: z.literal("electricity"),
  ...commonBillFields,
  contractedPowerKw: PowerPeriods,
  consumptionKwh: EnergyPeriods,
  /** A flat-price tariff repeats the same €/kWh in p1, p2 and p3. */
  prices: z.object({
    powerEurPerKwDay: PowerPeriods,
    energyEurPerKwh: EnergyPeriods,
  }),
  /** "Financiación bono social": regulated, same for every retailer, so it's reused for every tariff. */
  socialBonusFinancingEur: nullableDecimal,
  meterRentalEur: nullableDecimal,
  /** Optional add-ons (maintenance, insurance…) before VAT. Null means the bill has none. */
  otherServicesEur: nullableDecimal,
  confidence: z.object({
    ...commonConfidenceFields,
    contractedPowerKw: ConfidenceLevel,
    consumptionKwh: ConfidenceLevel,
    prices: ConfidenceLevel,
    socialBonusFinancingEur: ConfidenceLevel,
    meterRentalEur: ConfidenceLevel,
    otherServicesEur: ConfidenceLevel,
  }),
});
export type ElectricityBill = z.infer<typeof ElectricityBill>;

/** What the calculator needs from a tariff. The bill's own tariff is built from its extracted prices and discounts. */
export const ElectricityTariffTerms = z.object({
  prices: z.object({
    powerEurPerKwDay: z.object({ p1: DecimalString, p2: DecimalString }),
    energyEurPerKwh: z.object({ p1: DecimalString, p2: DecimalString, p3: DecimalString }),
  }),
  /** Retailer offers have []; only the bill's own tariff carries the user's discounts. */
  discounts: z.array(Discount),
});
export type ElectricityTariffTerms = z.infer<typeof ElectricityTariffTerms>;

/** One entry in data/tariffs/electricity/*.json. */
export const ElectricityTariff = ElectricityTariffTerms.extend({
  energyType: z.literal("electricity"),
  retailer: z.string(),
  tariffName: z.string(),
  accessTariff: z.literal("2.0TD"),
  sourceUrl: z.url(),
  checkedAt: z.iso.date(),
  validFrom: z.iso.date(),
  /** false while prices are placeholders; the UI must not present an unverified tariff as real. */
  verified: z.boolean(),
});
export type ElectricityTariff = z.infer<typeof ElectricityTariff>;
