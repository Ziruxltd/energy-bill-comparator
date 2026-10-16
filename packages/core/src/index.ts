// Pure domain logic: no AI, network or file system.
export {
  compareTariffs,
  CROSS_CHECK_TOLERANCE,
  crossCheck,
  type Comparison,
  type CrossCheck,
  type Offer,
} from "./compare";
export { electricityCalculator } from "./electricity/calculator";
export { ElectricityBill, ElectricityTariff, ElectricityTariffTerms } from "./electricity/schema";
export { ExtractedBill, type EnergyType } from "./extracted-bill";
export type {
  BillBreakdown,
  BreakdownLine,
  CalculationResult,
  EnergyCalculator,
} from "./shared/calculator";
export { roundToCents, sumAmounts } from "./shared/money";
export { BillingPeriod, ConfidenceLevel, DecimalString, Discount } from "./shared/schema";
export { vatAmount } from "./shared/vat";
