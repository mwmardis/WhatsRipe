"use server";

import { db } from "@/lib/db";
import type { WeeklyPlanOutput } from "@/lib/ai/schemas";

const MEAL_TYPES = ["dinner", "breakfast", "lunch"] as const;

export async function savePlan(
  householdId: string,
  weeklyPlanData: WeeklyPlanOutput,
  weekOffset: number = 0
) {
  // weekStart = Monday of the target week
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + mondayOffset + weekOffset * 7);
  weekStart.setHours(0, 0, 0, 0);

  const weeklyPlan = await db.weeklyPlan.create({
    data: {
      householdId,
      weekStart,
    },
  });

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const dayData = weeklyPlanData.days[dayIndex];

    const dailyPlan = await db.dailyPlan.create({
      data: {
        weeklyPlanId: weeklyPlan.id,
        dayOfWeek: dayIndex,
      },
    });

    for (const mealType of MEAL_TYPES) {
      const mealData = dayData[mealType];
      if (!mealData) continue;

      await db.meal.create({
        data: {
          dailyPlanId: dailyPlan.id,
          mealType,
          name: mealData.name,
          description: mealData.description,
          seasonalIngredients: JSON.stringify(mealData.seasonalIngredients),
          freezerFriendly: mealData.freezerFriendly ?? false,
          estimatedPrepTime: mealData.estimatedPrepTime,
          estimatedCookTime: mealData.estimatedCookTime,
          cookingMethod: mealData.cookingMethod ?? "standard",
          estimatedCost: mealData.estimatedCost ?? null,
          leftoverTip: mealData.leftoverTip ?? null,
          kidCookingTasks: mealData.kidCookingTasks
            ? JSON.stringify(mealData.kidCookingTasks)
            : null,
        },
      });
    }
  }

  return getLatestPlan(householdId);
}

export async function getLatestPlan(householdId: string) {
  return db.weeklyPlan.findFirst({
    where: { householdId },
    orderBy: { createdAt: "desc" },
    include: {
      dailyPlans: {
        orderBy: { dayOfWeek: "asc" },
        include: {
          meals: {
            include: {
              ratings: true,
            },
          },
        },
      },
    },
  });
}

export async function getPlansForWeeks(householdId: string, weeks: number) {
  return db.weeklyPlan.findMany({
    where: { householdId },
    orderBy: { weekStart: "desc" },
    take: weeks,
    include: {
      dailyPlans: {
        orderBy: { dayOfWeek: "asc" },
        include: {
          meals: {
            include: {
              ratings: true,
            },
          },
        },
      },
    },
  });
}

export async function deletePlan(id: string) {
  return db.weeklyPlan.delete({
    where: { id },
  });
}
