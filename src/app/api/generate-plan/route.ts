export const maxDuration = 60;

import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { getModel } from "@/lib/ai/provider";
import { weeklyPlanSchema } from "@/lib/ai/schemas";
import { buildWeeklyPlanPrompt } from "@/lib/ai/prompts";
import { getCurrentSeason, getSeasonalIngredients } from "@/lib/seasons";
import { getOrCreateHousehold } from "@/app/settings/actions";
import { db } from "@/lib/db";

export async function POST() {
  try {
    const household = await getOrCreateHousehold();

    const now = new Date();
    const jsDay = now.getDay(); // 0=Sun, 1=Mon, ...
    const startDayIndex = jsDay === 0 ? 6 : jsDay - 1; // Convert to 0=Mon, 6=Sun

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
    const busyDays: number[] = JSON.parse(household.busyDays);
    const preferredCookingMethods: string[] = JSON.parse(
      household.preferredCookingMethods
    );

    // Get pantry items for context
    const pantryItems = await db.pantryItem.findMany({
      where: { householdId: household.id },
      select: { name: true },
    });
    const pantryItemNames = pantryItems.map((p) => p.name);

    // Get meal rating history for context
    // Get recent meal ratings (last 30 days, max 50) for feedback learning
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const mealRatings = await db.mealRating.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        rating: { in: ["loved", "refused"] }, // skip "ok" — neutral signal
        meal: {
          dailyPlan: {
            weeklyPlan: { householdId: household.id },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { mealName: true, rating: true },
    });
    const mealHistory = mealRatings.map((r) => ({
      name: r.mealName,
      rating: r.rating,
    }));

    const { system, user } = buildWeeklyPlanPrompt(
      season,
      ingredientNames,
      {
        dietaryPreferences,
        allergies,
        likedIngredients,
        dislikedIngredients,
        busyDays,
        pickyEaterMode: household.pickyEaterMode,
        weeklyBudget: household.weeklyBudget,
        preferredCookingMethods,
        pantryItems: pantryItemNames,
        mealHistory,
      },
      household.children,
      {
        breakfast: household.planBreakfast,
        lunch: household.planLunch,
      },
      household.useSeasonalFoods,
      startDayIndex
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
      planWeeks: household.planWeeks,
      startDayIndex,
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
