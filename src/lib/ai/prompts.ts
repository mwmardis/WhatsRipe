import type { Season } from "@/data/seasonal-ingredients";
import type { Child } from "@prisma/client";
import { getFoodStage, getFoodStageLabel, needsApproachSelector, type FeedingApproach } from "@/lib/food-stages";

export interface HouseholdContext {
  dietaryPreferences: string[];
  allergies: string[];
  likedIngredients: string[];
  dislikedIngredients: string[];
  busyDays?: number[];
  pickyEaterMode?: boolean;
  weeklyBudget?: number | null;
  preferredCookingMethods?: string[];
  pantryItems?: string[];
  mealHistory?: { name: string; rating: string }[];
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

    const ageMonths = Math.floor(
      (Date.now() - child.birthdate.getTime()) / (1000 * 60 * 60 * 24 * 30.4375)
    );
    const ageYears = Math.floor(ageMonths / 12);

    return `- ${child.name} (${ageYears > 0 ? `${ageYears}y${ageMonths % 12 > 0 ? ` ${ageMonths % 12}mo` : ""}` : `${ageMonths}mo`}): food stage "${stage}" (${label})${approachNote}.${allergyNote}`;
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

function buildFamilyFeaturesContext(household: HouseholdContext): string {
  const parts: string[] = [];

  if (household.busyDays && household.busyDays.length > 0) {
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const busyDayNames = household.busyDays.map((d) => dayNames[d]).filter(Boolean);
    parts.push(
      `BUSY DAYS (use quick meals under 20 min prep on these days): ${busyDayNames.join(", ")}.`
    );
  }

  if (household.pickyEaterMode) {
    parts.push(
      'PICKY EATER MODE: Include "hidden veggie" strategies (blend veggies into sauces/smoothies) and offer deconstructed versions where kids can assemble their own plate. Make meals visually appealing for children.'
    );
  }

  if (household.weeklyBudget) {
    parts.push(
      `BUDGET: Target weekly grocery budget is $${household.weeklyBudget}. Prioritize affordable ingredients, use pantry staples, and suggest budget-friendly protein sources.`
    );
  }

  if (household.preferredCookingMethods && household.preferredCookingMethods.length > 0) {
    const methods = household.preferredCookingMethods.filter((m) => m !== "standard");
    if (methods.length > 0) {
      parts.push(
        `PREFERRED COOKING METHODS: Include meals suitable for ${methods.join(" and ")} when possible.`
      );
    }
  }

  if (household.pantryItems && household.pantryItems.length > 0) {
    parts.push(
      `PANTRY INVENTORY (already on hand, no need to buy): ${household.pantryItems.join(", ")}.`
    );
  }

  if (household.mealHistory && household.mealHistory.length > 0) {
    const loved = household.mealHistory.filter((m) => m.rating === "loved").map((m) => m.name);
    const refused = household.mealHistory.filter((m) => m.rating === "refused").map((m) => m.name);
    if (loved.length > 0) {
      parts.push(`FAMILY FAVORITES (generate meals with similar flavors, ingredients, and cooking styles): ${loved.join(", ")}.`);
    }
    if (refused.length > 0) {
      parts.push(`MEALS FAMILY REFUSED (avoid these and meals with similar flavor profiles or main ingredients): ${refused.join(", ")}.`);
    }
  }

  return parts.length > 0 ? `\n\n${parts.join("\n")}` : "";
}

export function buildWeeklyPlanPrompt(
  season: Season,
  seasonalIngredients: string[],
  household: HouseholdContext,
  children: Child[],
  mealTypes: { breakfast: boolean; lunch: boolean },
  useSeasonalFoods: boolean = true,
  startDayIndex: number = 0
): { system: string; user: string } {
  const numDays = 7 - startDayIndex;
  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const startDayName = dayNames[startDayIndex];
  const planDaysDescription = startDayIndex === 0
    ? "Always return exactly 7 days of meals (Monday through Sunday)."
    : `Return exactly ${numDays} days of meals (${startDayName} through Sunday).`;

  const dayCount = 7 - startDayIndex;
  const planLabel = startDayIndex === 0
    ? "a 7-day meal plan"
    : `a ${dayCount}-day meal plan (${startDayName} through Sunday)`;

  const hasChildren = children.length > 0;
  const childAges = children.map((c) => {
    return Math.floor(
      (Date.now() - c.birthdate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    );
  });

  const system = `You are a family meal planning assistant for the WhatsRipe app. You create practical, delicious weekly meal plans${useSeasonalFoods ? " that prioritize seasonal ingredients" : ""}. Your plans should be varied throughout the week, avoid repeating proteins on consecutive days, and be realistic for home cooking.

${hasChildren ? "When children are present, ensure meals are family-friendly and can be adapted for younger eaters. " : ""}${useSeasonalFoods ? "Each meal should feature at least one seasonal ingredient prominently." : ""}

${planDaysDescription} Each day MUST have a dinner. Breakfast and lunch are included only if requested.

For each meal provide:
- name: a concise, appealing meal name
- description: 1-2 sentence description of the dish
- seasonalIngredients: list of seasonal ingredients used${useSeasonalFoods ? " from the provided list" : " (empty array if not seasonal)"}
- estimatedPrepTime: prep time in minutes
- estimatedCookTime: cook time in minutes
- freezerFriendly: whether this meal freezes well for batch cooking
- cookingMethod: "standard", "slow-cooker", or "instant-pot"
- estimatedCost: estimated ingredient cost in dollars for a family of 4
- leftoverTip: brief suggestion for how to repurpose leftovers of this meal
- kidCookingTasks: array of age-appropriate tasks kids can help with (task description + minimum age in years)${hasChildren && childAges.some((a) => a >= 2) ? `. Include tasks for children ages ${[...new Set(childAges.filter((a) => a >= 2))].join(", ")}` : ""}

Also analyze the complete weekly plan and provide batch cooking suggestions. Identify ingredients or components that appear in multiple meals across the week. For each, suggest how to prepare them in advance to save time. Include what to prep, which meals use it, how to store it, and estimated time savings.`;

  let user = useSeasonalFoods
    ? `Create ${planLabel} for the current season: ${season}.

Available seasonal ingredients: ${seasonalIngredients.join(", ")}.

Meal types to plan for each day:
- Dinner: YES (always)
- Breakfast: ${mealTypes.breakfast ? "YES" : "NO"}
- Lunch: ${mealTypes.lunch ? "YES" : "NO"}`
    : `Create ${planLabel}.

Meal types to plan for each day:
- Dinner: YES (always)
- Breakfast: ${mealTypes.breakfast ? "YES" : "NO"}
- Lunch: ${mealTypes.lunch ? "YES" : "NO"}`;

  user += buildDietaryContext(household);
  user += buildFamilyFeaturesContext(household);
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
    ? `You are a family meal planning assistant for the WhatsRipe app. You suggest alternative meals that use seasonal ingredients. Provide exactly 3 alternatives that are different from the existing meals in the plan.

For each meal provide all fields: name, description, seasonalIngredients, estimatedPrepTime, estimatedCookTime, freezerFriendly, cookingMethod, estimatedCost, leftoverTip, and kidCookingTasks.`
    : `You are a family meal planning assistant for the WhatsRipe app. You suggest alternative meals. Provide exactly 3 alternatives that are different from the existing meals in the plan.

For each meal provide all fields: name, description, seasonalIngredients (empty array), estimatedPrepTime, estimatedCookTime, freezerFriendly, cookingMethod, estimatedCost, leftoverTip, and kidCookingTasks.`;

  let user = useSeasonalFoods
    ? `Suggest 3 alternative dinner options for the ${season} season.

Available seasonal ingredients: ${seasonalIngredients.join(", ")}.

Existing meals in the current plan (do NOT repeat these): ${existingMealNames.join(", ")}.`
    : `Suggest 3 alternative dinner options.

Existing meals in the current plan (do NOT repeat these): ${existingMealNames.join(", ")}.`;

  user += buildDietaryContext(household);
  user += buildFamilyFeaturesContext(household);
  user += buildChildrenContext(children);

  return { system, user };
}
