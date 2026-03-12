import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateHousehold } from "@/app/settings/actions";
import { createHebShoppingList, addItemsToHebList } from "@/lib/heb-client";

export async function POST(request: Request) {
  try {
    const { groceryListId } = await request.json();

    const household = await getOrCreateHousehold();

    if (!household.hebSessionToken || !household.hebStoreId) {
      return NextResponse.json(
        { error: "HEB settings not configured. Add your HEB token and store ID in settings." },
        { status: 400 }
      );
    }

    const groceryList = await db.groceryList.findUnique({
      where: { id: groceryListId },
      include: { items: { where: { checked: false } } },
    });

    if (!groceryList || groceryList.items.length === 0) {
      return NextResponse.json(
        { error: "No unchecked items to export" },
        { status: 400 }
      );
    }

    const config = {
      sessionToken: household.hebSessionToken,
      storeId: household.hebStoreId,
    };

    const today = new Date().toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
    });
    const listName = `WhatsRipe - ${today}`;

    // Create list
    const listId = await createHebShoppingList(config, listName);

    // Add items (single batch)
    const items = groceryList.items.map((item) => ({ name: item.name }));
    await addItemsToHebList(config, listId, items);

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
