import Decimal from "decimal.js";
import { electricityCalculator } from "./electricity/calculator";
import type { ElectricityTariffTerms } from "./electricity/schema";
import type { ExtractedBill } from "./extracted-bill";
import type { BillBreakdown } from "./shared/calculator";
import { roundToCents } from "./shared/money";

/** Registry: adding an energy type means adding its calculator here. */
const calculators = { electricity: electricityCalculator } as const;

/** Above this relative gap between our recalculation and the printed total, the extraction is flagged as uncertain. */
export const CROSS_CHECK_TOLERANCE = new Decimal("0.02");

export type CrossCheck =
  | { status: "match" | "mismatch"; recalculatedEur: Decimal; printedEur: Decimal }
  | { status: "unavailable" };

export interface Offer<TTariff> {
  tariff: TTariff;
  breakdown: BillBreakdown;
  /** Positive means the offer is cheaper. Null when there's nothing to compare against. */
  savingsEur: Decimal | null;
  annualSavingsEur: Decimal | null;
}

export type Comparison<TTariff> =
  | { ok: true; current: BillBreakdown | null; crossCheck: CrossCheck; offers: Offer<TTariff>[] }
  | { ok: false; missingFields: string[] };

export const crossCheck = (recalculated: Decimal | null, printed: Decimal | null): CrossCheck => {
  if (recalculated === null || printed === null || printed.isZero())
    return { status: "unavailable" };
  const gap = recalculated.minus(printed).abs().dividedBy(printed);
  return {
    status: gap.greaterThan(CROSS_CHECK_TOLERANCE) ? "mismatch" : "match",
    recalculatedEur: recalculated,
    printedEur: printed,
  };
};

/**
 * Recalculates the bill under each tariff and ranks them cheapest first. Savings are measured against
 * the bill recalculated with its own prices (same rules for both sides), or the printed total if that fails.
 */
export const compareTariffs = <TTariff extends ElectricityTariffTerms>(
  bill: ExtractedBill,
  tariffs: readonly TTariff[],
): Comparison<TTariff> => {
  const calculator = calculators[bill.energyType];
  const ownTariff = calculator.currentTariff(bill);
  const ownResult = ownTariff && calculator.calculateBill(bill, ownTariff);
  if (ownResult && !ownResult.ok) return ownResult;

  const current = ownResult?.breakdown ?? null;
  const printed = bill.totalAmountEur === null ? null : new Decimal(bill.totalAmountEur);
  const baseline = current?.totalEur ?? printed;
  const days = bill.billingPeriod.days;

  const offers: Offer<TTariff>[] = [];
  for (const tariff of tariffs) {
    const result = calculator.calculateBill(bill, tariff);
    // Missing fields are bill fields, so they fail every tariff the same way.
    if (!result.ok) return result;
    const savingsEur = baseline && baseline.minus(result.breakdown.totalEur);
    offers.push({
      tariff,
      breakdown: result.breakdown,
      savingsEur,
      annualSavingsEur:
        savingsEur && days ? roundToCents(savingsEur.dividedBy(days).times(365)) : null,
    });
  }
  offers.sort((a, b) => a.breakdown.totalEur.comparedTo(b.breakdown.totalEur));

  return { ok: true, current, crossCheck: crossCheck(current?.totalEur ?? null, printed), offers };
};
