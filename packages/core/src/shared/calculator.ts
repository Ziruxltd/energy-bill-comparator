import type Decimal from "decimal.js";

/** One printed line of a recalculated bill. `concept` is a stable key the UI translates (e.g. "power"). */
export interface BreakdownLine {
  concept: string;
  amountEur: Decimal;
}

export interface BillBreakdown {
  lines: BreakdownLine[];
  totalEur: Decimal;
}

/** A bill with null fields can't always be recalculated; the result says which fields were missing. */
export type CalculationResult =
  { ok: true; breakdown: BillBreakdown } | { ok: false; missingFields: string[] };

/**
 * Contract every energy type implements. compare.ts only talks to this interface,
 * so adding gas means adding a calculator, not editing electricity code.
 */
export interface EnergyCalculator<TBill extends { energyType: string }, TTariff> {
  readonly energyType: TBill["energyType"];
  calculateBill(bill: TBill, tariff: TTariff): CalculationResult;
}
