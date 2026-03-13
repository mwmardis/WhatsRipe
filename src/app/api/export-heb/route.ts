import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateHousehold } from "@/app/settings/actions";
import {
  createHebShoppingList,
  addItemsToHebList,
  getLastRefreshedTokens,
  clearRefreshedTokens,
} from "@/lib/heb-client";

export async function POST(request: Request) {
  try {
    const { groceryListId } = await request.json();

    const household = await getOrCreateHousehold();

    if (!household.hebSessionToken || !household.hebStoreId) {
      return NextResponse.json(
        { error: "HEB settings not configured. Add your HEB tokens and store ID in settings." },
        { status: 400 }
      );
    }

    const groceryList = await db.groceryList.findUnique({
      where: { id: groceryListId },
      include: {
        items: {
          where: { checked: false },
          include: { productMapping: true },
        },
      },
    });

    if (!groceryList || groceryList.items.length === 0) {
      return NextResponse.json(
        { error: "No unchecked items to export" },
        { status: 400 }
      );
    }

    const config = {
      sessionToken: household.hebSessionToken,
      sstToken: household.hebSstToken ?? undefined,
      storeId: household.hebStoreId,
    };

    const today = new Date().toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
    });
    const listName = `WhatsRipe - ${today}`;

    // Clear any stale refreshed tokens before starting
    clearRefreshedTokens();

    // Create list
    const listId = await createHebShoppingList(config, listName);

    // Add items (single batch)
    const items = groceryList.items.map((item) => ({
      name: item.name,
      hebProductId: item.productMapping?.hebProductId,
    }));
    await addItemsToHebList(config, listId, items);

    // Persist any refreshed tokens back to the database
    const refreshed = getLastRefreshedTokens();
    if (refreshed.sat || refreshed.sst) {
      await db.householdProfile.update({
        where: { id: household.id },
        data: {
          ...(refreshed.sat && { hebSessionToken: refreshed.sat }),
          ...(refreshed.sst && { hebSstToken: refreshed.sst }),
        },
      });
    }

    const listUrl = `https://www.heb.com/shopping-list/${listId}`;

    return NextResponse.json({ listUrl, itemCount: items.length });
  } catch (error) {
    console.error("HEB export failed:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
