import { describe, expect, it } from "vitest";
import { BillingPeriod, DecimalString } from "../../src/shared/schema";

describe("DecimalString", () => {
  it.each(["0", "78.42", "0.123456"])("accepts %s", (value) => {
    expect(DecimalString.safeParse(value).success).toBe(true);
  });

  it.each([
    ["a comma decimal separator", "78,42"],
    ["a negative amount", "-5.00"],
    ["a currency symbol", "78.42 €"],
    ["an empty string", ""],
  ])("rejects %s", (_, value) => {
    expect(DecimalString.safeParse(value).success).toBe(false);
  });

  it("rejects JSON numbers, so amounts never pass through floating point", () => {
    expect(DecimalString.safeParse(78.42).success).toBe(false);
  });
});

describe("BillingPeriod", () => {
  it("accepts a period with ISO dates", () => {
    const period = { startDate: "2026-08-01", endDate: "2026-08-31", days: 31 };
    expect(BillingPeriod.safeParse(period).success).toBe(true);
  });

  it("accepts nulls for fields not found on the bill", () => {
    const period = { startDate: null, endDate: null, days: null };
    expect(BillingPeriod.safeParse(period).success).toBe(true);
  });

  it("rejects an end date before the start date", () => {
    const period = { startDate: "2026-08-31", endDate: "2026-08-01", days: 31 };
    const result = BillingPeriod.safeParse(period);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["endDate"]);
  });

  it("rejects Spanish date format, the model must normalise to ISO", () => {
    const period = { startDate: "01/08/2026", endDate: "31/08/2026", days: 31 };
    expect(BillingPeriod.safeParse(period).success).toBe(false);
  });

  it("rejects a non-positive number of days", () => {
    const period = { startDate: "2026-08-01", endDate: "2026-08-31", days: 0 };
    expect(BillingPeriod.safeParse(period).success).toBe(false);
  });
});
