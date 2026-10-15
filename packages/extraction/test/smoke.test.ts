import { describe, expect, it } from "vitest";
import { EXTRACTION_PACKAGE } from "../src/index";

describe("extraction package", () => {
  it("is importable", () => {
    expect(EXTRACTION_PACKAGE).toBe("@ebc/extraction");
  });
});
