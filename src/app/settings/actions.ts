"use server";

import { db } from "@/lib/db";

export async function getOrCreateHousehold() {
  let household = await db.householdProfile.findFirst({
    include: { children: true, familyMembers: true },
  });

  if (!household) {
    household = await db.householdProfile.create({
      data: {},
      include: { children: true, familyMembers: true },
    });
  }

  return household;
}

export async function updateHousehold(data: {
  dietaryPreferences: string[];
  allergies: string[];
  likedIngredients: string[];
  dislikedIngredients: string[];
  planBreakfast: boolean;
  planLunch: boolean;
  useSeasonalFoods: boolean;
  busyDays: number[];
  pickyEaterMode: boolean;
  weeklyBudget: number | null;
  mealPrepDay: number | null;
  planWeeks: number;
  preferredCookingMethods: string[];
  hebSessionToken: string | null;
  hebStoreId: string | null;
}) {
  const household = await getOrCreateHousehold();

  return db.householdProfile.update({
    where: { id: household.id },
    data: {
      dietaryPreferences: JSON.stringify(data.dietaryPreferences),
      allergies: JSON.stringify(data.allergies),
      likedIngredients: JSON.stringify(data.likedIngredients),
      dislikedIngredients: JSON.stringify(data.dislikedIngredients),
      planBreakfast: data.planBreakfast,
      planLunch: data.planLunch,
      useSeasonalFoods: data.useSeasonalFoods,
      busyDays: JSON.stringify(data.busyDays),
      pickyEaterMode: data.pickyEaterMode,
      weeklyBudget: data.weeklyBudget,
      mealPrepDay: data.mealPrepDay,
      planWeeks: data.planWeeks,
      preferredCookingMethods: JSON.stringify(data.preferredCookingMethods),
      hebSessionToken: data.hebSessionToken,
      hebStoreId: data.hebStoreId,
    },
    include: { children: true },
  });
}

export async function addChild(data: { name: string; birthdate: string; feedingApproach?: string }) {
  const household = await getOrCreateHousehold();

  return db.child.create({
    data: {
      name: data.name,
      birthdate: new Date(data.birthdate),
      feedingApproach: data.feedingApproach ?? "combination",
      householdId: household.id,
    },
  });
}

export async function updateChild(
  id: string,
  data: { name: string; birthdate: string; allergies: string[]; feedingApproach?: string }
) {
  return db.child.update({
    where: { id },
    data: {
      name: data.name,
      birthdate: new Date(data.birthdate),
      allergies: JSON.stringify(data.allergies),
      ...(data.feedingApproach !== undefined && { feedingApproach: data.feedingApproach }),
    },
  });
}

export async function removeChild(id: string) {
  return db.child.delete({
    where: { id },
  });
}
