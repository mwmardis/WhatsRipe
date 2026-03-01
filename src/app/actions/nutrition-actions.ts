"use server";

import { generateObject } from "ai";
import { z } from "zod";
import { db } from "@/lib/db";
import { getModel } from "@/lib/ai/provider";

const nutritionSummarySchema = z.object({
  dailySummaries: z.array(
    z.object({
      day: z.string(),
      calories: z.number(),
      protein: z.number(),
      carbs: z.number(),
      fat: z.number(),
      fiber: z.number(),
    })
  ),
  weeklyHighlights: z.object({
    strengths: z.array(z.string()),
    gaps: z.array(z.string()),
    suggestions: z.array(z.string()),
  }),
  nutrientCoverage: z.array(
    z.object({
      nutrient: z.string(),
      status: z.enum(["good", "low", "high"]),
      note: z.string(),
    })
  ),
});

export type NutritionSummary = z.infer<typeof nutritionSummarySchema>;

export async function generateNutritionSummary(
  weeklyPlanId: string
): Promise<NutritionSummary> {
  const plan = await db.weeklyPlan.findUnique({
    where: { id: weeklyPlanId },
    include: {
      dailyPlans: {
        orderBy: { dayOfWeek: "asc" },
        include: { meals: true },
      },
      household: { include: { children: true } },
    },
  });

  if (!plan) throw new Error("Plan not found");

  const dayNames = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const mealDescriptions = plan.dailyPlans
    .map((dp) => {
      const meals = dp.meals
        .map((m) => `${m.mealType}: ${m.name} - ${m.description}`)
        .join("\n  ");
      return `${dayNames[dp.dayOfWeek]}:\n  ${meals}`;
    })
    .join("\n\n");

  const hasChildren = plan.household.children.length > 0;

  const { object } = await generateObject({
    model: getModel(),
    schema: nutritionSummarySchema,
    system: `You are a family nutrition advisor. Analyze a weekly meal plan and provide estimated nutritional information. Give practical, helpful feedback focused on family health.${hasChildren ? " Consider that there are young children in the household who need adequate iron, calcium, and vitamins." : ""}`,
    prompt: `Analyze this weekly meal plan for nutritional balance:\n\n${mealDescriptions}\n\nProvide:\n1. Estimated daily macros (calories, protein g, carbs g, fat g, fiber g)\n2. Weekly highlights: strengths, nutritional gaps, and suggestions\n3. Key nutrient coverage (iron, calcium, vitamin C, vitamin A, omega-3, fiber, zinc, vitamin D) - mark as good/low/high with a brief note`,
  });

  return object;
}
