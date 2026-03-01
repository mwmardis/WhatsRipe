"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getOrCreateHousehold } from "@/app/settings/actions";

export async function getPantryItems() {
  const household = await getOrCreateHousehold();
  return db.pantryItem.findMany({
    where: { householdId: household.id },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
}

export async function addPantryItem(data: {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiresAt?: string;
}) {
  const household = await getOrCreateHousehold();
  const item = await db.pantryItem.create({
    data: {
      householdId: household.id,
      name: data.name,
      quantity: data.quantity,
      unit: data.unit,
      category: data.category,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  });
  revalidatePath("/pantry");
  return item;
}

export async function updatePantryItem(id: string, data: {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiresAt?: string | null;
}) {
  const item = await db.pantryItem.update({
    where: { id },
    data: {
      name: data.name,
      quantity: data.quantity,
      unit: data.unit,
      category: data.category,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  });
  revalidatePath("/pantry");
  return item;
}

export async function removePantryItem(id: string) {
  await db.pantryItem.delete({ where: { id } });
  revalidatePath("/pantry");
}

export async function clearExpiredItems() {
  const household = await getOrCreateHousehold();
  await db.pantryItem.deleteMany({
    where: {
      householdId: household.id,
      expiresAt: { lt: new Date() },
    },
  });
  revalidatePath("/pantry");
}
