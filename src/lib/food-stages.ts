export type FoodStage = "6-12mo" | "12-18mo" | "18-24mo" | "24mo+";

export type FeedingApproach = "traditional" | "blw" | "combination";

export function getFoodStage(birthdate: Date): FoodStage {
  const now = new Date();
  const ageInDays = (now.getTime() - birthdate.getTime()) / (1000 * 60 * 60 * 24);
  const ageInMonths = Math.floor(ageInDays / 30.4375);
  if (ageInMonths < 6) return "6-12mo"; // treat under-6mo same as 6-12mo
  if (ageInMonths < 12) return "6-12mo";
  if (ageInMonths < 18) return "12-18mo";
  if (ageInMonths < 24) return "18-24mo";
  return "24mo+";
}

const labels: Record<FeedingApproach, Record<FoodStage, string>> = {
  traditional: {
    "6-12mo": "Purees & soft solids",
    "12-18mo": "Modified table food",
    "18-24mo": "Table food (minor adjustments)",
    "24mo+": "Eats with family",
  },
  blw: {
    "6-12mo": "Soft finger foods",
    "12-18mo": "Self-fed table food",
    "18-24mo": "Independent table food",
    "24mo+": "Eats with family",
  },
  combination: {
    "6-12mo": "Purees & finger foods",
    "12-18mo": "Modified & self-fed food",
    "18-24mo": "Table food (some help)",
    "24mo+": "Eats with family",
  },
};

export function getFoodStageLabel(
  stage: FoodStage,
  approach: FeedingApproach = "traditional"
): string {
  return labels[approach][stage];
}

export function needsApproachSelector(stage: FoodStage): boolean {
  return stage !== "24mo+";
}
