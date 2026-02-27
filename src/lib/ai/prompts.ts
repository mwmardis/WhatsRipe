import type { Season } from "@/data/seasonal-ingredients";
import type { Child } from "@prisma/client";
import { getFoodStage, getFoodStageLabel, needsApproachSelector, type FeedingApproach } from "@/lib/food-stages";

interface HouseholdContext {
  dietaryPreferences: string[];
  allergies: string[];
  likedIngredients: string[];
  dislikedIngredients: string[];
}

function buildChildrenContext(children: Child[]): string {
  if (children.length === 0) return "";

  const lines = children.map((child) => {
    const stage = getFoodStage(child.birthdate);
    const approach = (child.feedingApproach ?? "combination") as FeedingApproach;
    const label = getFoodStageLabel(stage, approach);
    const childAllergies: string[] = JSON.parse(child.allergies || "[]");
    const allergyNote =
      childAllergies.length > 0
        ? ` Allergies: ${childAllergies.join(", ")}.`
        : "";
    const approachNote = needsApproachSelector(stage)
      ? `, feeding approach: ${approach}`
      : "";
    return `- ${child.name}: food stage "${stage}" (${label})${approachNote}.${allergyNote}`;
  });

  return `\n\nChildren in the household:\n${lines.join("\n")}`;
}

function buildDietaryContext(household: HouseholdContext): string {
  const parts: string[] = [];

  if (household.dietaryPreferences.length > 0) {
    parts.push(
      `Dietary preferences: ${household.dietaryPreferences.join(", ")}.`
    );
  }
  if (household.allergies.length > 0) {
    parts.push(
      `Allergies (MUST avoid): ${household.allergies.join(", ")}.`
    );
  }
  if (household.likedIngredients.length > 0) {
    parts.push(
      `Liked ingredients (prefer these): ${household.likedIngredients.join(", ")}.`
    );
  }
  if (household.dislikedIngredients.length > 0) {
    parts.push(
      `Disliked ingredients (avoid if possible): ${household.dislikedIngredients.join(", ")}.`
    );
  }

  return parts.length > 0 ? `\n\n${parts.join("\n")}` : "";
}

export function buildWeeklyPlanPrompt(
  season: Season,
  seasonalIngredients: string[],
  household: HouseholdContext,
  children: Child[],
  mealTypes: { breakfast: boolean; lunch: boolean },
  useSeasonalFoods: boolean = true
): { system: string; user: string } {
  const system = useSeasonalFoods
    ? `You are a family meal planning assistant for the WhatsRipe app. You create practical, delicious weekly meal plans that prioritize seasonal ingredients. Your plans should be varied throughout the week, avoid repeating proteins on consecutive days, and be realistic for home cooking.

When children are present, ensure meals are family-friendly and can be adapted for younger eaters. Each meal should feature at least one seasonal ingredient prominently.

Always return exactly 7 days of meals (Monday through Sunday). Each day MUST have a dinner. Breakfast and lunch are included only if requested.

For each meal provide:
- name: a concise, appealing meal name
- description: 1-2 sentence description of the dish
- seasonalIngredients: list of seasonal ingredients used from the provided list
- estimatedPrepTime: prep time in minutes
- estimatedCookTime: cook time in minutes`
    : `You are a family meal planning assistant for the WhatsRipe app. You create practical, delicious weekly meal plans. Your plans should be varied throughout the week, avoid repeating proteins on consecutive days, and be realistic for home cooking.

When children are present, ensure meals are family-friendly and can be adapted for younger eaters.

Always return exactly 7 days of meals (Monday through Sunday). Each day MUST have a dinner. Breakfast and lunch are included only if requested.

For each meal provide:
- name: a concise, appealing meal name
- description: 1-2 sentence description of the dish
- seasonalIngredients: leave as empty array
- estimatedPrepTime: prep time in minutes
- estimatedCookTime: cook time in minutes`;

  let user = useSeasonalFoods
    ? `Create a 7-day meal plan for the current season: ${season}.

Available seasonal ingredients: ${seasonalIngredients.join(", ")}.

Meal types to plan for each day:
- Dinner: YES (always)
- Breakfast: ${mealTypes.breakfast ? "YES" : "NO"}
- Lunch: ${mealTypes.lunch ? "YES" : "NO"}`
    : `Create a 7-day meal plan.

Meal types to plan for each day:
- Dinner: YES (always)
- Breakfast: ${mealTypes.breakfast ? "YES" : "NO"}
- Lunch: ${mealTypes.lunch ? "YES" : "NO"}`;

  user += buildDietaryContext(household);
  user += buildChildrenContext(children);

  if (children.length > 0) {
    user +=
      "\n\nPlease ensure meals are family-friendly and suitable for adaptation to the children's food stages.";
  }

  return { system, user };
}

export function buildRecipePrompt(
  mealName: string,
  mealDescription: string,
  household: HouseholdContext,
  children: Child[]
): { system: string; user: string } {
  const system = `You are a recipe writer for the WhatsRipe family meal planning app. You write clear, detailed recipes that are practical for home cooks. When children are present, include specific adaptations for each child's food stage.`;

  let user = `Write a full recipe for: "${mealName}"
Description: ${mealDescription}`;

  user += buildDietaryContext(household);
  user += buildChildrenContext(children);

  if (children.length > 0) {
    const childInstructions = children
      .map((child) => {
        const stage = getFoodStage(child.birthdate);
        if (!needsApproachSelector(stage)) return null;
        const approach = (child.feedingApproach ?? "combination") as FeedingApproach;
        switch (approach) {
          case "traditional":
            return `For ${child.name}: provide puree/mash instructions appropriate for their stage.`;
          case "blw":
            return `For ${child.name}: provide finger food suggestions with safe sizes and soft-cooked textures. Do not suggest purees.`;
          case "combination":
            return `For ${child.name}: provide BOTH a puree/mash version AND a finger food version side by side, so the parent can choose.`;
          default:
            return `For ${child.name}: include baby/toddler adaptations for their food stage.`;
        }
      })
      .filter(Boolean);

    if (childInstructions.length > 0) {
      user += `\n\nBaby/toddler adaptation instructions:\n${childInstructions.join("\n")}`;
    } else {
      user +=
        "\n\nInclude baby/toddler adaptations for each child's food stage, explaining how to modify the dish.";
    }
  }

  return { system, user };
}

export function buildSwapPrompt(
  season: Season,
  seasonalIngredients: string[],
  household: HouseholdContext,
  children: Child[],
  existingMealNames: string[],
  useSeasonalFoods: boolean = true
): { system: string; user: string } {
  const system = useSeasonalFoods
    ? `You are a family meal planning assistant for the WhatsRipe app. You suggest alternative meals that use seasonal ingredients. Provide exactly 3 alternatives that are different from the existing meals in the plan.`
    : `You are a family meal planning assistant for the WhatsRipe app. You suggest alternative meals. Provide exactly 3 alternatives that are different from the existing meals in the plan.`;

  let user = useSeasonalFoods
    ? `Suggest 3 alternative dinner options for the ${season} season.

Available seasonal ingredients: ${seasonalIngredients.join(", ")}.

Existing meals in the current plan (do NOT repeat these): ${existingMealNames.join(", ")}.`
    : `Suggest 3 alternative dinner options.

Existing meals in the current plan (do NOT repeat these): ${existingMealNames.join(", ")}.`;

  user += buildDietaryContext(household);
  user += buildChildrenContext(children);

  return { system, user };
}
