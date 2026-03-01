"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function getAllergenLogs(childId: string) {
  return db.allergenLog.findMany({
    where: { childId },
    orderBy: { introducedAt: "desc" },
  });
}

export async function addAllergenLog(data: {
  childId: string;
  allergen: string;
  introducedAt: string;
  reaction: string;
  notes?: string;
}) {
  const log = await db.allergenLog.create({
    data: {
      childId: data.childId,
      allergen: data.allergen,
      introducedAt: new Date(data.introducedAt),
      reaction: data.reaction,
      notes: data.notes || null,
    },
  });
  revalidatePath("/allergen-tracker");
  return log;
}

export async function removeAllergenLog(id: string) {
  await db.allergenLog.delete({ where: { id } });
  revalidatePath("/allergen-tracker");
}
