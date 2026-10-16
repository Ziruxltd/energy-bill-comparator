import type Decimal from "decimal.js";
import { roundToCents, sumAmounts } from "../shared/money";

export interface EnergyPeriodsDecimal {
  p1: Decimal;
  p2: Decimal;
  p3: Decimal;
}

/**
 * Energy term: Σ kWh × €/kWh over p1–p3, rounded once. Bills print it as one line;
 * rounding each period first can be a cent off (a real bill: 19.12 printed, 19.13 per-period).
 */
export const energyLine = (kwh: EnergyPeriodsDecimal, eurPerKwh: EnergyPeriodsDecimal): Decimal =>
  roundToCents(
    sumAmounts([
      kwh.p1.times(eurPerKwh.p1),
      kwh.p2.times(eurPerKwh.p2),
      kwh.p3.times(eurPerKwh.p3),
    ]),
  );
