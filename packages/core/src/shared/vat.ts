import type Decimal from "decimal.js";
import { roundToCents } from "./money";

/** VAT line of a bill. `rate` is a fraction (e.g. 0.21), passed in from the energy type's tax-rates.ts. */
export const vatAmount = (base: Decimal, rate: Decimal): Decimal => roundToCents(base.times(rate));
