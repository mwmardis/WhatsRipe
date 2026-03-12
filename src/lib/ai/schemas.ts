import { z } from "zod";

export const mealSchema = z.object({
  name: z.string(),
  description: z.string(),
  seasonalIngredients: z.array(z.string()),
  estimatedPrepTime: z.number(),
  estimatedCookTime: z.number(),
  freezerFriendly: z.boolean(),
  cookingMethod: z.enum(["standard", "slow-cooker", "instant-pot"]),
  estimatedCost: z.number(), // estimated cost in dollars
  leftoverTip: z.string(), // how to repurpose leftovers
  kidCookingTasks: z.array(
    z.object({
      task: z.string(),
      minAge: z.number(), // minimum age in years
    })
  ),
});

export const dailyPlanSchema = z.object({
  dinner: mealSchema,
  breakfast: mealSchema.optional(),
  lunch: mealSchema.optional(),
});

export const batchCookingSuggestionSchema = z.object({
  component: z.string(),
  usedInMeals: z.array(z.string()),
  prepInstructions: z.string(),
  timesSaved: z.string(),
});

export const weeklyPlanSchema = z.object({
  days: z.array(dailyPlanSchema).min(1).max(7),
  batchCookingSuggestions: z.array(batchCookingSuggestionSchema),
});

export type MealOutput = z.infer<typeof mealSchema>;
export type DailyPlanOutput = z.infer<typeof dailyPlanSchema>;
export type WeeklyPlanOutput = z.infer<typeof weeklyPlanSchema>;
export type BatchCookingSuggestion = z.infer<typeof batchCookingSuggestionSchema>;
