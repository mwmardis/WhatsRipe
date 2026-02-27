import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { getModel } from "@/lib/ai/provider";
import { weeklyPlanSchema } from "@/lib/ai/schemas";
import { buildWeeklyPlanPrompt } from "@/lib/ai/prompts";
import { getCurrentSeason, getSeasonalIngredients } from "@/lib/seasons";
import { getOrCreateHousehold } from "@/app/settings/actions";

export async function POST() {
  try {
    const household = await getOrCreateHousehold();

    const season = getCurrentSeason();
    const ingredients = getSeasonalIngredients(season);
    const ingredientNames = ingredients.map((i) => i.name);

    const dietaryPreferences: string[] = JSON.parse(
      household.dietaryPreferences
    );
    const allergies: string[] = JSON.parse(household.allergies);
    const likedIngredients: string[] = JSON.parse(household.likedIngredients);
    const dislikedIngredients: string[] = JSON.parse(
      household.dislikedIngredients
    );

    const { system, user } = buildWeeklyPlanPrompt(
      season,
      ingredientNames,
      {
        dietaryPreferences,
        allergies,
        likedIngredients,
        dislikedIngredients,
      },
      household.children,
      {
        breakfast: household.planBreakfast,
        lunch: household.planLunch,
      },
      household.useSeasonalFoods
    );

    const { object } = await generateObject({
      model: getModel(),
      schema: weeklyPlanSchema,
      system,
      prompt: user,
    });

    return NextResponse.json({
      plan: object,
      season,
      householdId: household.id,
    });
  } catch (error) {
    console.error("Plan generation failed:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to generate meal plan", details: message },
      { status: 500 }
    );
  }
}
