"use server";

import { generateObject } from "ai";
import { z } from "zod";
import { db } from "@/lib/db";
import { getModel } from "@/lib/ai/provider";

const prepScheduleSchema = z.object({
  totalTime: z.number(), // total minutes
  tasks: z.array(
    z.object({
      startTime: z.string(), // e.g. "0:00", "0:15"
      duration: z.number(), // minutes
      task: z.string(),
      forMeal: z.string(), // which meal this prep is for
      tip: z.string().optional(),
    })
  ),
  storageInstructions: z.array(
    z.object({
      meal: z.string(),
      instruction: z.string(),
      keepDays: z.number(),
    })
  ),
});

export type PrepSchedule = z.infer<typeof prepScheduleSchema>;

export async function generatePrepSchedule(
  weeklyPlanId: string
): Promise<PrepSchedule> {
  const plan = await db.weeklyPlan.findUnique({
    where: { id: weeklyPlanId },
    include: {
      dailyPlans: {
        orderBy: { dayOfWeek: "asc" },
        include: { meals: true },
      },
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

  const { object } = await generateObject({
    model: getModel(),
    schema: prepScheduleSchema,
    system: `You are a meal prep planning assistant. Create an efficient, timed meal prep schedule that helps a family prepare components for the week's meals in a single session. Group similar tasks together (e.g., all chopping at once, all oven items together). Be practical and realistic about timing.`,
    prompt: `Create a meal prep schedule for these weekly meals:\n\n${mealDescriptions}\n\nDesign a prep day schedule that:\n1. Groups similar tasks (chopping, marinating, cooking)\n2. Uses parallel cooking when possible (e.g., oven + stovetop)\n3. Starts from 0:00 with realistic time estimates\n4. Includes storage instructions for each prepped item\n5. Focuses on prep that actually saves time during the week (sauces, marinades, chopping, pre-cooking grains/proteins)`,
  });

  return object;
}
