import { describe, it, expect, vi, afterEach } from "vitest";
import { getCurrentSeason, getSeasonalIngredients } from "@/lib/seasons";
import { seasonalIngredients } from "@/data/seasonal-ingredients";

describe("getCurrentSeason", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    [0, "winter"],
    [1, "winter"],
    [2, "spring"],
    [3, "spring"],
    [4, "spring"],
    [5, "summer"],
    [6, "summer"],
    [7, "summer"],
    [8, "fall"],
    [9, "fall"],
    [10, "fall"],
    [11, "winter"],
  ] as const)("returns correct season for month %i", (month, expected) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, month, 15));
    expect(getCurrentSeason()).toBe(expected);
    vi.useRealTimers();
  });
});

describe("getSeasonalIngredients", () => {
  it("returns only ingredients available in summer", () => {
    const summer = getSeasonalIngredients("summer");
    expect(summer.length).toBeGreaterThan(0);
    for (const item of summer) {
      expect(item.seasons).toContain("summer");
    }
  });

  it("returns only ingredients available in winter", () => {
    const winter = getSeasonalIngredients("winter");
    expect(winter.length).toBeGreaterThan(0);
    for (const item of winter) {
      expect(item.seasons).toContain("winter");
    }
  });

  it("does not include ingredients that are not in the given season", () => {
    const spring = getSeasonalIngredients("spring");
    const springNames = spring.map((i) => i.name);
    // blueberries are summer-only
    expect(springNames).not.toContain("blueberries");
  });

  it("includes ingredients available in multiple seasons", () => {
    const fall = getSeasonalIngredients("fall");
    const fallNames = fall.map((i) => i.name);
    // apples are fall + winter
    expect(fallNames).toContain("apples");
  });

  it("returns results across all categories", () => {
    const summer = getSeasonalIngredients("summer");
    const categories = new Set(summer.map((i) => i.category));
    expect(categories).toContain("fruit");
    expect(categories).toContain("vegetable");
    expect(categories).toContain("herb");
    expect(categories).toContain("protein");
  });
});

describe("seasonalIngredients data integrity", () => {
  it("has at least 60 ingredients total", () => {
    expect(seasonalIngredients.length).toBeGreaterThanOrEqual(60);
  });

  it("has at least 15 items per category", () => {
    const counts: Record<string, number> = {};
    for (const item of seasonalIngredients) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    expect(counts.fruit).toBeGreaterThanOrEqual(15);
    expect(counts.vegetable).toBeGreaterThanOrEqual(15);
    expect(counts.herb).toBeGreaterThanOrEqual(15);
    expect(counts.protein).toBeGreaterThanOrEqual(15);
  });

  it("every ingredient has at least one season", () => {
    for (const item of seasonalIngredients) {
      expect(item.seasons.length).toBeGreaterThanOrEqual(1);
    }
  });
});
