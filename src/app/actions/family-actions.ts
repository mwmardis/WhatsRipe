"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getOrCreateHousehold } from "@/app/settings/actions";

export async function getFamilyMembers() {
  const household = await getOrCreateHousehold();
  return db.familyMember.findMany({
    where: { householdId: household.id },
    orderBy: { createdAt: "asc" },
  });
}

export async function addFamilyMember(data: {
  name: string;
  email?: string;
  role: string;
}) {
  const household = await getOrCreateHousehold();
  const member = await db.familyMember.create({
    data: {
      householdId: household.id,
      name: data.name,
      email: data.email || null,
      role: data.role,
    },
  });
  revalidatePath("/settings");
  return member;
}

export async function updateFamilyMember(
  id: string,
  data: {
    name: string;
    email?: string;
    role: string;
  }
) {
  const member = await db.familyMember.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email || null,
      role: data.role,
    },
  });
  revalidatePath("/settings");
  return member;
}

export async function removeFamilyMember(id: string) {
  await db.familyMember.delete({ where: { id } });
  revalidatePath("/settings");
}
