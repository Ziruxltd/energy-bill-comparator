// Instructions only. The JSON shape comes from the ElectricityBill schema via structured outputs.
export const ELECTRICITY_EXTRACTION_PROMPT = `You read a Spanish household electricity bill (access tariff 2.0TD) and copy the values printed on it into the JSON schema.

Golden rule: copy, never calculate. Do not add, multiply, convert or estimate any number. If a value is not printed, use null (or [] for lists). Code recalculates the bill later, so a wrong guess is worse than a null.

Formats:
- Numbers are strings with a dot as the decimal separator, no thousands separator and no unit: "0,108192 €/kW día" becomes "0.108192", "1.234,5 kWh" becomes "1234.5".
- Dates are YYYY-MM-DD: "22/07/2026" becomes "2026-07-22".

Fields:
- retailer: the retailer's brand name (e.g. "Iberdrola"), not the distributor. tariffName: the commercial plan name if printed.
- billingPeriod: start and end dates of the billing period, and "días facturados".
- contractedPowerKw: p1 = punta, p2 = valle.
- consumptionKwh: kWh per period, p1 = punta, p2 = llano, p3 = valle. Bills often give these in a sentence such as "consumos desagregados". If only a total is printed, use null for each period.
- prices.powerEurPerKwDay: the power price in €/kW día for p1 and p2. If it is printed in another unit (€/kW año, €/kW mes), use null.
- prices.energyEurPerKwh: the energy price in €/kWh per period. If one price applies to all hours, repeat it in p1, p2 and p3.
- socialBonusFinancingEur: the "financiación bono social" amount.
- meterRentalEur: the "alquiler de equipos de medida" amount.
- otherServices: every add-on that is not electricity supply (maintenance, insurance, assistance services), one item per printed line, with its amount before VAT.
- discounts: every discount line, with the amount as a positive number.
- totalAmountEur: the final amount of the bill, VAT included.
- confidence: per field group, "high" when the value is clearly printed, "medium" when you had to choose between similar values, "low" when unsure or null.`;
