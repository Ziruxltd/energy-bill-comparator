import type Decimal from "decimal.js";
import { roundToCents } from "../shared/money";

/** Power term for one period: kW × €/kW·day × days. Bills print one line per period, so round each one. */
export const powerLine = (kw: Decimal, eurPerKwDay: Decimal, days: Decimal): Decimal =>
  roundToCents(kw.times(eurPerKwDay).times(days));
