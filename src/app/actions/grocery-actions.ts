"use server";

import { generateObject } from "ai";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getModel } from "@/lib/ai/provider";
import { groceryListSchema, buildGroceryPrompt } from "@/lib/ai/grocery-prompt";

export async function generateGroceryList(weeklyPlanId: string) {
  // Load all meals for the plan
  const weeklyPlan = await db.weeklyPlan.findUnique({
    where: { id: weeklyPlanId },
    include: {
      dailyPlans: {
        include: {
          meals: true,
        },
      },
    },
  });

  if (!weeklyPlan) {
    throw new Error("Weekly plan not found");
  }

  // Flatten all meals
  const meals = weeklyPlan.dailyPlans.flatMap((dp) =>
    dp.meals.map((meal) => ({
      name: meal.name,
      description: meal.description,
      seasonalIngredients: meal.seasonalIngredients,
    }))
  );

  if (meals.length === 0) {
    throw new Error("No meals found in this plan");
  }

  const { system, user } = buildGroceryPrompt(meals);

  const { object } = await generateObject({
    model: getModel(),
    schema: groceryListSchema,
    system,
    prompt: user,
  });

  // Delete existing grocery list for this plan if any
  await db.groceryList.deleteMany({
    where: { weeklyPlanId },
  });

  // Create grocery list and items
  const groceryList = await db.groceryList.create({
    data: {
      weeklyPlanId,
      items: {
        create: object.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          storeSection: item.storeSection,
          checked: false,
          manuallyAdded: false,
        })),
      },
    },
    include: {
      items: {
        orderBy: { storeSection: "asc" },
      },
    },
  });

  revalidatePath("/groceries");
  return groceryList;
}

export async function getGroceryList(weeklyPlanId: string) {
  return db.groceryList.findUnique({
    where: { weeklyPlanId },
    include: {
      items: {
        orderBy: { storeSection: "asc" },
      },
    },
  });
}

export async function toggleGroceryItem(id: string) {
  const item = await db.groceryItem.findUnique({ where: { id } });
  if (!item) throw new Error("Grocery item not found");

  const updated = await db.groceryItem.update({
    where: { id },
    data: { checked: !item.checked },
  });

  revalidatePath("/groceries");
  return updated;
}

export async function addGroceryItem(
  groceryListId: string,
  data: {
    name: string;
    quantity: number;
    unit: string;
    storeSection: string;
  }
) {
  const item = await db.groceryItem.create({
    data: {
      groceryListId,
      name: data.name,
      quantity: data.quantity,
      unit: data.unit,
      storeSection: data.storeSection,
      checked: false,
      manuallyAdded: true,
    },
  });

  revalidatePath("/groceries");
  return item;
}

export async function clearCheckedItems(groceryListId: string) {
  await db.groceryItem.deleteMany({
    where: {
      groceryListId,
      checked: true,
    },
  });

  revalidatePath("/groceries");
}
