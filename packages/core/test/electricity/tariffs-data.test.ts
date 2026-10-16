import { describe, expect, it } from "vitest";
import tariffs from "../../../../data/tariffs/electricity/2026-10.json";
import { ElectricityTariff } from "../../src/electricity/schema";

describe("data/tariffs/electricity/2026-10.json", () => {
  it("matches the ElectricityTariff schema", () => {
    expect(ElectricityTariff.array().safeParse(tariffs).error).toBeUndefined();
  });

  it("has one tariff per v1 retailer", () => {
    expect(tariffs.map((tariff) => tariff.retailer)).toEqual([
      "Iberdrola",
      "Endesa",
      "Naturgy",
      "TotalEnergies",
      "Repsol",
      "EDP",
      "Holaluz",
      "Octopus Energy",
    ]);
  });
});
