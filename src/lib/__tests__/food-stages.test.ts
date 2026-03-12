import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getFoodStage,
  getFoodStageLabel,
  needsApproachSelector,
  type FoodStage,
  type FeedingApproach,
} from "../food-stages";

describe("getFoodStageLabel", () => {
  const cases: [FoodStage, FeedingApproach, string][] = [
    // Traditional
    ["6-12mo", "traditional", "Purees & soft solids"],
    ["12-18mo", "traditional", "Modified table food"],
    ["18-24mo", "traditional", "Table food (minor adjustments)"],
    ["24mo+", "traditional", "Eats with family"],
    // BLW
    ["6-12mo", "blw", "Soft finger foods"],
    ["12-18mo", "blw", "Self-fed table food"],
    ["18-24mo", "blw", "Independent table food"],
    ["24mo+", "blw", "Eats with family"],
    // Combination
    ["6-12mo", "combination", "Purees & finger foods"],
    ["12-18mo", "combination", "Modified & self-fed food"],
    ["18-24mo", "combination", "Table food (some help)"],
    ["24mo+", "combination", "Eats with family"],
  ];

  it.each(cases)(
    "returns %j for stage=%s approach=%s",
    (stage, approach, expected) => {
      expect(getFoodStageLabel(stage, approach)).toBe(expected);
    }
  );

  it("defaults to traditional labels when no approach is given", () => {
    expect(getFoodStageLabel("6-12mo")).toBe("Purees & soft solids");
    expect(getFoodStageLabel("12-18mo")).toBe("Modified table food");
    expect(getFoodStageLabel("18-24mo")).toBe("Table food (minor adjustments)");
    expect(getFoodStageLabel("24mo+")).toBe("Eats with family");
  });
});

describe("needsApproachSelector", () => {
  it("returns true for stages below 24mo+", () => {
    expect(needsApproachSelector("6-12mo")).toBe(true);
    expect(needsApproachSelector("12-18mo")).toBe(true);
    expect(needsApproachSelector("18-24mo")).toBe(true);
  });

  it("returns false for 24mo+", () => {
    expect(needsApproachSelector("24mo+")).toBe(false);
  });
});

describe("getFoodStage", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 6-12mo for a 3-month-old", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15"));
    const birthdate = new Date("2026-03-15");
    expect(getFoodStage(birthdate)).toBe("6-12mo");
  });

  it("returns 6-12mo for a 9-month-old", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-12-15"));
    const birthdate = new Date("2026-03-15");
    expect(getFoodStage(birthdate)).toBe("6-12mo");
  });

  it("returns 12-18mo for a 14-month-old", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-05-15"));
    const birthdate = new Date("2026-03-15");
    expect(getFoodStage(birthdate)).toBe("12-18mo");
  });

  it("returns 18-24mo for a 20-month-old", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-11-15"));
    const birthdate = new Date("2026-03-15");
    expect(getFoodStage(birthdate)).toBe("18-24mo");
  });

  it("returns 24mo+ for a 30-month-old", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2028-09-15"));
    const birthdate = new Date("2026-03-15");
    expect(getFoodStage(birthdate)).toBe("24mo+");
  });

  it("handles edge case: born Jan 31, checked Feb 1 (should be 0 months, not 1)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-01"));
    const birthdate = new Date("2026-01-31");
    expect(getFoodStage(birthdate)).toBe("6-12mo");
  });

  it("handles edge case: born Dec 31, checked Jan 1 next year", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-01-01"));
    const birthdate = new Date("2026-12-31");
    expect(getFoodStage(birthdate)).toBe("6-12mo");
  });
});
