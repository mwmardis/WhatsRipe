"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function rateMeal(data: {
  mealId: string;
  mealName: string;
  rating: string; // "loved", "ok", "refused"
  notes?: string;
}) {
  // Upsert - one rating per meal
  const existing = await db.mealRating.findFirst({
    where: { mealId: data.mealId },
  });

  if (existing) {
    const rating = await db.mealRating.update({
      where: { id: existing.id },
      data: {
        rating: data.rating,
        notes: data.notes || null,
      },
    });
    revalidatePath(`/meal/${data.mealId}`);
    return rating;
  }

  const rating = await db.mealRating.create({
    data: {
      mealId: data.mealId,
      mealName: data.mealName,
      rating: data.rating,
      notes: data.notes || null,
    },
  });
  revalidatePath(`/meal/${data.mealId}`);
  return rating;
}

export async function getMealRating(mealId: string) {
  return db.mealRating.findFirst({
    where: { mealId },
  });
}

export async function getMealRatingHistory() {
  return db.mealRating.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
