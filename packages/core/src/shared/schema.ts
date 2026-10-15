import { z } from "zod";

/**
 * Money and quantities travel as decimal strings ("78.42"), never JSON numbers,
 * so no value passes through floating point before it reaches decimal.js.
 */
export const DecimalString = z
  .string()
  .regex(/^\d+(\.\d+)?$/, "Expected a non-negative decimal string like 78.42");

export const ConfidenceLevel = z.enum(["high", "medium", "low"]);
export type ConfidenceLevel = z.infer<typeof ConfidenceLevel>;

export const BillingPeriod = z
  .object({
    startDate: z.iso.date().nullable(),
    endDate: z.iso.date().nullable(),
    days: z.int().positive().nullable(),
  })
  // ISO dates compare correctly as strings
  .refine((period) => !period.startDate || !period.endDate || period.endDate >= period.startDate, {
    message: "endDate must not be before startDate",
    path: ["endDate"],
  });
export type BillingPeriod = z.infer<typeof BillingPeriod>;

export const Discount = z.object({
  description: z.string(),
  amountEur: DecimalString,
});
export type Discount = z.infer<typeof Discount>;

/**
 * Fields every energy type extracts. A field not found on the bill is null, never invented;
 * the calculator decides whether what was found is enough to calculate.
 */
export const commonBillFields = {
  retailer: z.string().nullable(),
  tariffName: z.string().nullable(),
  billingPeriod: BillingPeriod,
  discounts: z.array(Discount),
  totalAmountEur: DecimalString.nullable(),
};

/** One confidence level per common field; each energy type adds keys for its own fields. */
export const commonConfidenceFields = {
  retailer: ConfidenceLevel,
  tariffName: ConfidenceLevel,
  billingPeriod: ConfidenceLevel,
  discounts: ConfidenceLevel,
  totalAmountEur: ConfidenceLevel,
};
