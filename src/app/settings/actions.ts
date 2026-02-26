"use server";

import { db } from "@/lib/db";

export async function getOrCreateHousehold() {
  let household = await db.householdProfile.findFirst({
    include: { children: true },
  });

  if (!household) {
    household = await db.householdProfile.create({
      data: {},
      include: { children: true },
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
    },
    include: { children: true },
  });
}

export async function addChild(data: { name: string; birthdate: string }) {
  const household = await getOrCreateHousehold();

  return db.child.create({
    data: {
      name: data.name,
      birthdate: new Date(data.birthdate),
      householdId: household.id,
    },
  });
}

export async function updateChild(
  id: string,
  data: { name: string; birthdate: string; allergies: string[] }
) {
  return db.child.update({
    where: { id },
    data: {
      name: data.name,
      birthdate: new Date(data.birthdate),
      allergies: JSON.stringify(data.allergies),
    },
  });
}

export async function removeChild(id: string) {
  return db.child.delete({
    where: { id },
  });
}
