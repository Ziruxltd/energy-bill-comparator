import Decimal from "decimal.js";
import type { BreakdownLine, CalculationResult, EnergyCalculator } from "../shared/calculator";
import { sumAmounts } from "../shared/money";
import { vatAmount } from "../shared/vat";
import { energyLine } from "./energy";
import { powerLine } from "./power";
import type { ElectricityBill, ElectricityTariffTerms } from "./schema";
import { ELECTRICITY_VAT_RATE } from "./tax-rates";
import { electricityTax } from "./taxes";

/** Bill fields the calculation can't do without, as dotted paths for `missingFields`. */
const requiredFields = (bill: ElectricityBill): Record<string, string | number | null> => ({
  "billingPeriod.days": bill.billingPeriod.days,
  "contractedPowerKw.p1": bill.contractedPowerKw.p1,
  "contractedPowerKw.p2": bill.contractedPowerKw.p2,
  "consumptionKwh.p1": bill.consumptionKwh.p1,
  "consumptionKwh.p2": bill.consumptionKwh.p2,
  "consumptionKwh.p3": bill.consumptionKwh.p3,
  socialBonusFinancingEur: bill.socialBonusFinancingEur,
  meterRentalEur: bill.meterRentalEur,
});

const toDecimal = (value: string | number | null): Decimal => new Decimal(value ?? 0);

/**
 * Line order and tax bases follow a real 2.0TD bill: the electricity tax applies to power + energy +
 * social bonus; meter rental and add-on services are outside it; VAT applies to everything.
 */
const calculateBill = (
  bill: ElectricityBill,
  tariff: ElectricityTariffTerms,
): CalculationResult => {
  const required = requiredFields(bill);
  const missingFields = Object.keys(required).filter((field) => required[field] === null);
  if (missingFields.length > 0) return { ok: false, missingFields };

  const days = toDecimal(bill.billingPeriod.days);
  const kwh = {
    p1: toDecimal(bill.consumptionKwh.p1),
    p2: toDecimal(bill.consumptionKwh.p2),
    p3: toDecimal(bill.consumptionKwh.p3),
  };
  const { powerEurPerKwDay, energyEurPerKwh } = tariff.prices;

  const taxableLines: BreakdownLine[] = [
    {
      concept: "powerP1",
      amountEur: powerLine(
        toDecimal(bill.contractedPowerKw.p1),
        new Decimal(powerEurPerKwDay.p1),
        days,
      ),
    },
    {
      concept: "powerP2",
      amountEur: powerLine(
        toDecimal(bill.contractedPowerKw.p2),
        new Decimal(powerEurPerKwDay.p2),
        days,
      ),
    },
    {
      concept: "energy",
      amountEur: energyLine(kwh, {
        p1: new Decimal(energyEurPerKwh.p1),
        p2: new Decimal(energyEurPerKwh.p2),
        p3: new Decimal(energyEurPerKwh.p3),
      }),
    },
    // TODO: verify with a bill that has a discount that it's applied before the electricity tax.
    ...tariff.discounts.map((discount) => ({
      concept: "discount",
      amountEur: new Decimal(discount.amountEur).negated(),
    })),
    { concept: "socialBonusFinancing", amountEur: toDecimal(bill.socialBonusFinancingEur) },
  ];
  const taxBase = sumAmounts(taxableLines.map((line) => line.amountEur));
  const totalKwh = sumAmounts([kwh.p1, kwh.p2, kwh.p3]);

  const linesBeforeVat: BreakdownLine[] = [
    ...taxableLines,
    { concept: "electricityTax", amountEur: electricityTax(taxBase, totalKwh) },
    { concept: "meterRental", amountEur: toDecimal(bill.meterRentalEur) },
    // shortcut: the bill's add-ons are added to every tariff so totals match the bill and savings are unaffected;
    // the UI must label them "services from your current bill".
    ...(bill.otherServicesEur === null
      ? []
      : [{ concept: "otherServices", amountEur: new Decimal(bill.otherServicesEur) }]),
  ];
  const vatBase = sumAmounts(linesBeforeVat.map((line) => line.amountEur));
  const lines = [
    ...linesBeforeVat,
    { concept: "vat", amountEur: vatAmount(vatBase, ELECTRICITY_VAT_RATE) },
  ];

  return {
    ok: true,
    breakdown: { lines, totalEur: sumAmounts(lines.map((line) => line.amountEur)) },
  };
};

const currentTariff = (bill: ElectricityBill): ElectricityTariffTerms | null => {
  const { powerEurPerKwDay: power, energyEurPerKwh: energy } = bill.prices;
  if (
    power.p1 === null ||
    power.p2 === null ||
    energy.p1 === null ||
    energy.p2 === null ||
    energy.p3 === null
  ) {
    return null;
  }
  return {
    prices: {
      powerEurPerKwDay: { p1: power.p1, p2: power.p2 },
      energyEurPerKwh: { p1: energy.p1, p2: energy.p2, p3: energy.p3 },
    },
    discounts: bill.discounts,
  };
};

export const electricityCalculator: EnergyCalculator<ElectricityBill, ElectricityTariffTerms> = {
  energyType: "electricity",
  calculateBill,
  currentTariff,
};
