import { describe, it, expect } from "vitest";
import { normalizeName, jaccardSimilarity, findBestMatch } from "../fuzzy-match";

describe("normalizeName", () => {
  it("lowercases and trims", () => {
    expect(normalizeName("  Chicken Breast  ")).toBe("chicken breast");
  });

  it("removes common qualifiers", () => {
    expect(normalizeName("fresh organic chicken breast")).toBe("chicken breast");
    expect(normalizeName("large whole milk")).toBe("milk");
    expect(normalizeName("raw dried lentils")).toBe("lentil");
  });

  it("strips trailing s for basic plurals", () => {
    expect(normalizeName("avocados")).toBe("avocado");
    expect(normalizeName("tomatoes")).toBe("tomato");
  });

  it("does not strip s from words ending in ss", () => {
    expect(normalizeName("grass")).toBe("grass");
  });

  it("collapses multiple spaces", () => {
    expect(normalizeName("chicken   breast")).toBe("chicken breast");
  });
});

describe("jaccardSimilarity", () => {
  it("returns 1.0 for identical strings", () => {
    expect(jaccardSimilarity("chicken breast", "chicken breast")).toBe(1.0);
  });

  it("returns 0.0 for completely different strings", () => {
    expect(jaccardSimilarity("chicken", "milk")).toBe(0.0);
  });

  it("returns partial overlap score", () => {
    const score = jaccardSimilarity("chicken breast", "chicken thigh");
    // intersection: {chicken}, union: {chicken, breast, thigh} = 1/3
    expect(score).toBeCloseTo(1 / 3, 2);
  });
});

describe("findBestMatch", () => {
  const mappings = [
    { genericName: "chicken breast", id: "1" },
    { genericName: "whole milk", id: "2" },
    { genericName: "cheddar cheese", id: "3" },
  ];

  it("finds exact match", () => {
    const result = findBestMatch("chicken breast", mappings);
    expect(result).toEqual({ id: "1", score: 1.0 });
  });

  it("finds fuzzy match above threshold", () => {
    const result = findBestMatch("boneless chicken breast", mappings, 0.6);
    expect(result).not.toBeNull();
    expect(result!.id).toBe("1");
  });

  it("returns null when below threshold", () => {
    const result = findBestMatch("mozzarella cheese", mappings);
    expect(result).toBeNull();
  });

  it("returns null for empty mappings", () => {
    const result = findBestMatch("chicken", []);
    expect(result).toBeNull();
  });
});
