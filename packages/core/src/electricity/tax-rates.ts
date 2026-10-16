import Decimal from "decimal.js";

/**
 * Electricity tax (Impuesto Especial sobre la Electricidad, IEE). Ley 38/1992, art. 99.1.
 * Source: https://www.boe.es/buscar/act.php?id=BOE-A-1992-28741 (checked 2026-10-16).
 * RDL 7/2026 cut it to 0.5% from 22/03 to 31/05/2026; RDL 25/2026 allows the cut again in Nov–Dec 2026
 * only if electricity CPI rises > 15%. TODO: verify in December 2026:
 * https://sede.agenciatributaria.gob.es/Sede/impuestos-especiales-medioambientales/impuesto-especial-sobre-electricidad/medidas-tributarias-combatir-crisis-energetica-electricidad.html
 */
export const ELECTRICITY_TAX_RATE = new Decimal("0.0511269632");

/** Ley 38/1992, art. 99.2.b: the tax is at least 1 €/MWh for household ("otros usos") supply. Same source and date. */
export const ELECTRICITY_TAX_MIN_EUR_PER_KWH = new Decimal("0.001");

/** VAT general rate, Ley 37/1992, art. 90. Matches the 21 % printed on a real Aug 2026 bill (checked 2026-10-16). */
export const ELECTRICITY_VAT_RATE = new Decimal("0.21");
