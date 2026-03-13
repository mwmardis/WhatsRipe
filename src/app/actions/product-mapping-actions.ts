"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getOrCreateHousehold } from "@/app/settings/actions";

export async function createOrUpdateProductMapping(data: {
  genericName: string;
  hebProductId: string;
  hebProductName: string;
  hebBrand?: string | null;
  hebPrice?: number | null;
  hebSize?: string | null;
  hebImageUrl?: string | null;
  groceryItemId?: string;
}) {
  const household = await getOrCreateHousehold();

  const mapping = await db.productMapping.upsert({
    where: {
      householdId_hebProductId: {
        householdId: household.id,
        hebProductId: data.hebProductId,
      },
    },
    update: {
      genericName: data.genericName.toLowerCase().trim(),
      hebProductName: data.hebProductName,
      hebBrand: data.hebBrand ?? null,
      hebPrice: data.hebPrice ?? null,
      hebSize: data.hebSize ?? null,
      hebImageUrl: data.hebImageUrl ?? null,
    },
    create: {
      householdId: household.id,
      genericName: data.genericName.toLowerCase().trim(),
      hebProductId: data.hebProductId,
      hebProductName: data.hebProductName,
      hebBrand: data.hebBrand ?? null,
      hebPrice: data.hebPrice ?? null,
      hebSize: data.hebSize ?? null,
      hebImageUrl: data.hebImageUrl ?? null,
    },
  });

  // Link the grocery item if provided
  if (data.groceryItemId) {
    await db.groceryItem.update({
      where: { id: data.groceryItemId },
      data: { productMappingId: mapping.id },
    });
  }

  revalidatePath("/groceries");
  revalidatePath("/settings");
  return mapping;
}

export async function unlinkProductMapping(groceryItemId: string) {
  await db.groceryItem.update({
    where: { id: groceryItemId },
    data: { productMappingId: null },
  });
  revalidatePath("/groceries");
}

export async function deleteProductMapping(mappingId: string) {
  await db.productMapping.delete({
    where: { id: mappingId },
  });
  revalidatePath("/settings");
  revalidatePath("/groceries");
}

export async function getProductMappings() {
  const household = await getOrCreateHousehold();
  return db.productMapping.findMany({
    where: { householdId: household.id },
    orderBy: { genericName: "asc" },
  });
}
