import { z } from "zod";
import { ElectricityBill } from "./electricity/schema";

/**
 * Registry of energy types: adding one means adding its schema here (and its calculator in compare.ts),
 * never editing another type's module. Lives outside shared/ to avoid a shared <-> electricity import cycle.
 */
export const ExtractedBill = z.discriminatedUnion("energyType", [ElectricityBill]);
export type ExtractedBill = z.infer<typeof ExtractedBill>;
export type EnergyType = ExtractedBill["energyType"];
