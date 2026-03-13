import { NextResponse } from "next/server";
import { getOrCreateHousehold } from "@/app/settings/actions";
import {
  searchHebProducts,
  getLastRefreshedTokens,
  clearRefreshedTokens,
} from "@/lib/heb-client";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    const household = await getOrCreateHousehold();

    if (!household.hebSessionToken || !household.hebStoreId) {
      return NextResponse.json(
        { error: "HEB settings not configured. Add your HEB tokens and store ID in settings." },
        { status: 400 }
      );
    }

    const config = {
      sessionToken: household.hebSessionToken,
      sstToken: household.hebSstToken ?? undefined,
      storeId: household.hebStoreId,
    };

    clearRefreshedTokens();

    const products = await searchHebProducts(config, query.trim());

    // Persist any refreshed tokens
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

    return NextResponse.json({ products });
  } catch (error) {
    console.error("HEB search failed:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
