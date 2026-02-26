export type FoodStage = "6-12mo" | "12-18mo" | "18-24mo" | "24mo+";

export function getFoodStage(birthdate: Date): FoodStage {
  const now = new Date();
  const ageInMonths =
    (now.getFullYear() - birthdate.getFullYear()) * 12 +
    (now.getMonth() - birthdate.getMonth());
  if (ageInMonths < 6) return "6-12mo"; // treat under-6mo same as 6-12mo
  if (ageInMonths < 12) return "6-12mo";
  if (ageInMonths < 18) return "12-18mo";
  if (ageInMonths < 24) return "18-24mo";
  return "24mo+";
}

export function getFoodStageLabel(stage: FoodStage): string {
  const labels: Record<FoodStage, string> = {
    "6-12mo": "Purees & soft solids",
    "12-18mo": "Modified table food",
    "18-24mo": "Table food (minor adjustments)",
    "24mo+": "Eats with family",
  };
  return labels[stage];
}
