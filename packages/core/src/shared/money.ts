import Decimal from "decimal.js";

/**
 * Rounds to cents with ROUND_HALF_UP, as Spanish bills print each line.
 * Round once per bill line; keep intermediate math unrounded.
 */
export const roundToCents = (amount: Decimal): Decimal =>
  amount.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

export const sumAmounts = (amounts: readonly Decimal[]): Decimal =>
  amounts.reduce((total, amount) => total.plus(amount), new Decimal(0));
