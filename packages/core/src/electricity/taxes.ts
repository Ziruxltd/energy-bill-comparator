import Decimal from "decimal.js";
import { roundToCents } from "../shared/money";
import { ELECTRICITY_TAX_MIN_EUR_PER_KWH, ELECTRICITY_TAX_RATE } from "./tax-rates";

/** Electricity tax: base × rate, but never below the legal minimum per kWh consumed. */
export const electricityTax = (base: Decimal, totalKwh: Decimal): Decimal =>
  roundToCents(
    Decimal.max(base.times(ELECTRICITY_TAX_RATE), totalKwh.times(ELECTRICITY_TAX_MIN_EUR_PER_KWH)),
  );
