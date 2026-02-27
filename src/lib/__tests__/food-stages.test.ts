import { describe, it, expect } from "vitest";
import {
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
