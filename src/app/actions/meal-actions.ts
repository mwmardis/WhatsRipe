"use server";

import { z } from "zod";
import { generateObject } from "ai";
import { db } from "@/lib/db";
import { getModel } from "@/lib/ai/provider";
import { buildRecipePrompt, buildSwapPrompt } from "@/lib/ai/prompts";
import { mealSchema } from "@/lib/ai/schemas";
import { getCurrentSeason, getSeasonalIngredients } from "@/lib/seasons";

// ── Zod schemas for recipe generation ─────────────────────────────────

const recipeSchema = z.object({
  ingredients: z.array(
    z.object({
      name: z.string(),
      quantity: z.string(),
      unit: z.string(),
    })
  ),
  steps: z.array(z.string()),
  prepTime: z.number(),
  cookTime: z.number(),
});

const babyAdaptationSchema = z.object({
  stageName: z.string(),
  instructions: z.string(),
  modifications: z.array(z.string()),
});

const recipeWithAdaptationsSchema = z.object({
  recipe: recipeSchema,
  babyAdaptations: z.array(babyAdaptationSchema),
});

const alternativesSchema = z.object({
  alternatives: z.array(mealSchema).length(3),
});

// ── Exported types ────────────────────────────────────────────────────

export type Recipe = z.infer<typeof recipeSchema>;
export type BabyAdaptation = z.infer<typeof babyAdaptationSchema>;

// ── Server actions ────────────────────────────────────────────────────

export async function getMeal(id: string) {
  return db.meal.findUnique({
    where: { id },
    include: {
      dailyPlan: {
        include: {
          weeklyPlan: true,
        },
      },
    },
  });
}

export async function generateRecipe(mealId: string) {
  const meal = await db.meal.findUnique({
    where: { id: mealId },
    include: {
      dailyPlan: {
        include: {
          weeklyPlan: {
            include: {
              household: {
                include: { children: true },
              },
            },
          },
        },
      },
    },
  });

  if (!meal) throw new Error("Meal not found");

  const household = meal.dailyPlan.weeklyPlan.household;
  const children = household.children;

  const dietaryPreferences: string[] = JSON.parse(household.dietaryPreferences);
  const allergies: string[] = JSON.parse(household.allergies);
  const likedIngredients: string[] = JSON.parse(household.likedIngredients);
  const dislikedIngredients: string[] = JSON.parse(
    household.dislikedIngredients
  );

  const { system, user } = buildRecipePrompt(
    meal.name,
    meal.description,
    { dietaryPreferences, allergies, likedIngredients, dislikedIngredients },
    children
  );

  const { object } = await generateObject({
    model: getModel(),
    schema: recipeWithAdaptationsSchema,
    system,
    prompt: user,
  });

  const updated = await db.meal.update({
    where: { id: mealId },
    data: {
      recipe: JSON.stringify(object.recipe),
      babyAdaptations: JSON.stringify(object.babyAdaptations),
    },
  });

  return {
    recipe: object.recipe,
    babyAdaptations: object.babyAdaptations,
  };
}

export async function generateAlternatives(mealId: string) {
  const meal = await db.meal.findUnique({
    where: { id: mealId },
    include: {
      dailyPlan: {
        include: {
          weeklyPlan: {
            include: {
              household: {
                include: { children: true },
              },
              dailyPlans: {
                include: { meals: true },
              },
            },
          },
        },
      },
    },
  });

  if (!meal) throw new Error("Meal not found");

  const weeklyPlan = meal.dailyPlan.weeklyPlan;
  const household = weeklyPlan.household;
  const children = household.children;

  // Collect all existing meal names from the weekly plan
  const existingMealNames = weeklyPlan.dailyPlans.flatMap((dp) =>
    dp.meals.map((m) => m.name)
  );

  const season = getCurrentSeason();
  const seasonalIngredientsList = getSeasonalIngredients(season);
  const ingredientNames = seasonalIngredientsList.map((i) => i.name);

  const dietaryPreferences: string[] = JSON.parse(household.dietaryPreferences);
  const allergies: string[] = JSON.parse(household.allergies);
  const likedIngredients: string[] = JSON.parse(household.likedIngredients);
  const dislikedIngredients: string[] = JSON.parse(
    household.dislikedIngredients
  );

  const { system, user } = buildSwapPrompt(
    season,
    ingredientNames,
    { dietaryPreferences, allergies, likedIngredients, dislikedIngredients },
    children,
    existingMealNames
  );

  const { object } = await generateObject({
    model: getModel(),
    schema: alternativesSchema,
    system,
    prompt: user,
  });

  return object.alternatives;
}

export async function swapMeal(
  mealId: string,
  newMealData: {
    name: string;
    description: string;
    seasonalIngredients: string[];
  }
) {
  return db.meal.update({
    where: { id: mealId },
    data: {
      name: newMealData.name,
      description: newMealData.description,
      seasonalIngredients: JSON.stringify(newMealData.seasonalIngredients),
      recipe: null,
      babyAdaptations: null,
    },
  });
}
