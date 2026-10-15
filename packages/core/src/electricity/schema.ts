import { z } from "zod";
import {
  commonBillFields,
  commonConfidenceFields,
  ConfidenceLevel,
  DecimalString,
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
  prices: z.object({
    powerEurPerKwDay: PowerPeriods,
    energyEurPerKwh: EnergyPeriods,
  }),
  meterRentalEur: nullableDecimal,
  confidence: z.object({
    ...commonConfidenceFields,
    contractedPowerKw: ConfidenceLevel,
    consumptionKwh: ConfidenceLevel,
    prices: ConfidenceLevel,
    meterRentalEur: ConfidenceLevel,
  }),
});
export type ElectricityBill = z.infer<typeof ElectricityBill>;
