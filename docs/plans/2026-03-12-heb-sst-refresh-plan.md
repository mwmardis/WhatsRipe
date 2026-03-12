# HEB SST-Based SAT Auto-Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Automatically refresh the 30-minute HEB SAT token using the long-lived SST token, so users only need to set their tokens once per year.

**Architecture:** Modify `hebGraphQL()` to send both SST and SAT cookies, parse refreshed tokens from `Set-Cookie` response headers, and return them to the caller. The export route persists refreshed tokens back to the database. The settings UI adds an SST input field.

**Tech Stack:** Prisma (schema migration), Next.js server actions, React form state

---

### Task 1: Add `hebSstToken` to Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma:26`

**Step 1: Add the field**

In `prisma/schema.prisma`, add `hebSstToken` after `hebSessionToken` (line 26):

```prisma
  hebSessionToken         String?  // HEB sat cookie value (auto-refreshed)
  hebSstToken             String?  // HEB sst cookie value (long-lived, ~1 year)
  hebStoreId              String?  // HEB store number (e.g. "727")
```

Also update the existing comment on `hebSessionToken` from `// HEB sst cookie value for API auth` to `// HEB sat cookie value (auto-refreshed)`.

**Step 2: Create the migration**

Run: `npx prisma migrate dev --name add_heb_sst_token`

Expected: Migration created, Prisma client regenerated.

**Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add hebSstToken field to HouseholdProfile schema"
```

---

### Task 2: Update `heb-client.ts` to Handle Token Refresh

**Files:**
- Modify: `src/lib/heb-client.ts`

**Step 1: Write the failing test**

Create `src/lib/__tests__/heb-client.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

// We'll test the token parsing logic by extracting it into a testable function.
// For now, test the parseCookies helper we'll add.

describe("parseSetCookies", () => {
  it("extracts sst and sat values from Set-Cookie headers", async () => {
    const { parseSetCookies } = await import("../heb-client");

    const headers = [
      "sst=hs:sst:abc123; path=/; expires=Sat, 13 Mar 2027 03:47:17 GMT; httponly",
      "sst.sig=xyz789; path=/; expires=Sat, 13 Mar 2027 03:47:17 GMT; httponly",
      "sat=eyJhbGciOiJSUzI.payload.sig; path=/; expires=Thu, 12 Mar 2026 22:17:17 GMT; httponly",
      "other=value; path=/",
    ];

    const result = parseSetCookies(headers);
    expect(result.sst).toBe("hs:sst:abc123");
    expect(result.sat).toBe("eyJhbGciOiJSUzI.payload.sig");
  });

  it("returns undefined for missing cookies", async () => {
    const { parseSetCookies } = await import("../heb-client");

    const headers = ["other=value; path=/"];
    const result = parseSetCookies(headers);
    expect(result.sst).toBeUndefined();
    expect(result.sat).toBeUndefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/heb-client.test.ts`

Expected: FAIL — `parseSetCookies` is not exported.

**Step 3: Update `HebConfig` and add `parseSetCookies`, update `hebGraphQL`**

Replace the full contents of `src/lib/heb-client.ts` with:

```typescript
const HEB_GRAPHQL_URL = "https://www.heb.com/graphql";

const HASHES = {
  createShoppingList: "e79d5dcdfc241ae8692f04c8776611f1c720a4c79f57ebc35519eb22ace0d5db",
  addToShoppingListV2: "3706ce43a3800c3d3085bf695fc141845d08e20c5dad21fbdd936aebe0b51320",
} as const;

interface HebConfig {
  sessionToken: string;
  sstToken?: string;
  storeId: string;
}

export interface RefreshedTokens {
  sat?: string;
  sst?: string;
}

export function parseSetCookies(cookies: string[]): RefreshedTokens {
  const result: RefreshedTokens = {};
  for (const cookie of cookies) {
    const [nameValue] = cookie.split(";");
    const eqIdx = nameValue.indexOf("=");
    if (eqIdx === -1) continue;
    const name = nameValue.substring(0, eqIdx);
    const value = nameValue.substring(eqIdx + 1);
    if (name === "sst") result.sst = value;
    if (name === "sat") result.sat = value;
  }
  return result;
}

// Tracks the latest refreshed tokens from the most recent API call.
// The export route reads this after calls complete to persist updates.
let lastRefreshedTokens: RefreshedTokens = {};

export function getLastRefreshedTokens(): RefreshedTokens {
  return lastRefreshedTokens;
}

export function clearRefreshedTokens(): void {
  lastRefreshedTokens = {};
}

async function hebGraphQL(config: HebConfig, operations: unknown[]) {
  const cookieParts = [`sat=${config.sessionToken}`];
  if (config.sstToken) {
    cookieParts.unshift(`sst=${config.sstToken}`);
  }

  const res = await fetch(HEB_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
      origin: "https://www.heb.com",
      referer: "https://www.heb.com/shopping-list",
      cookie: cookieParts.join("; "),
    },
    body: JSON.stringify(operations),
  });

  // Parse refreshed tokens from response
  const setCookies = res.headers.getSetCookie
    ? res.headers.getSetCookie()
    : [];
  const refreshed = parseSetCookies(setCookies);
  if (refreshed.sat || refreshed.sst) {
    lastRefreshedTokens = { ...lastRefreshedTokens, ...refreshed };
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error("HEB session expired. Please update your HEB tokens in settings.");
    }
    throw new Error(`HEB API error: ${res.status}`);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      "HEB session expired or invalid. Please update your HEB tokens in settings."
    );
  }

  return res.json();
}

export async function createHebShoppingList(
  config: HebConfig,
  name: string
): Promise<string> {
  const response = await hebGraphQL(config, [
    {
      operationName: "createShoppingList",
      variables: { input: { name, storeId: config.storeId } },
      extensions: {
        persistedQuery: { version: 1, sha256Hash: HASHES.createShoppingList },
      },
    },
  ]);

  const gqlErrors = response?.[0]?.errors;
  if (gqlErrors?.some((e: { extensions?: { code?: string } }) => e.extensions?.code === "UNAUTHENTICATED")) {
    throw new Error("HEB session expired. Please update your HEB tokens in settings.");
  }
  const result = response?.[0]?.data?.createShoppingListV2;
  if (result?.code === "LIST_UNIQUE_NAME") {
    return createHebShoppingList(config, `${name} (${Date.now()})`);
  }
  if (!result?.id) {
    throw new Error("Failed to create HEB shopping list");
  }
  return result.id;
}

export async function addItemsToHebList(
  config: HebConfig,
  listId: string,
  items: { name: string }[]
): Promise<void> {
  await hebGraphQL(config, [
    {
      operationName: "addToShoppingListV2",
      variables: {
        input: {
          listId,
          listItems: items.map((item) => ({
            item: { genericName: item.name },
          })),
          page: { sort: "CATEGORY", sortDirection: "ASC" },
        },
      },
      extensions: {
        persistedQuery: { version: 1, sha256Hash: HASHES.addToShoppingListV2 },
      },
    },
  ]);
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/heb-client.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/heb-client.ts src/lib/__tests__/heb-client.test.ts
git commit -m "feat: add SST cookie support and token refresh parsing to heb-client"
```

---

### Task 3: Update Export Route to Persist Refreshed Tokens

**Files:**
- Modify: `src/app/api/export-heb/route.ts`

**Step 1: Update the route to send SST and persist refreshed tokens**

Replace `src/app/api/export-heb/route.ts` with:

```typescript
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
    const items = groceryList.items.map((item) => ({ name: item.name }));
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
```

**Step 2: Commit**

```bash
git add src/app/api/export-heb/route.ts
git commit -m "feat: persist refreshed HEB tokens after export"
```

---

### Task 4: Update Settings Actions and Form

**Files:**
- Modify: `src/app/settings/actions.ts:20-60`
- Modify: `src/components/settings/household-form.tsx:50-66,199-200,236-254,528-561`

**Step 1: Add `hebSstToken` to `updateHousehold` action**

In `src/app/settings/actions.ts`, add `hebSstToken: string | null;` to the `data` parameter type (after line 34), and add `hebSstToken: data.hebSstToken,` to the `data` object in the `db.householdProfile.update` call (after line 55).

**Step 2: Add `hebSstToken` to `HouseholdData` interface and form state**

In `src/components/settings/household-form.tsx`:

1. Add to `HouseholdData` interface (after line 64):
   ```typescript
   hebSstToken: string | null;
   ```

2. Add state (after line 199):
   ```typescript
   const [hebSstToken, setHebSstToken] = useState(initialData.hebSstToken ?? "");
   ```

3. Add to `handleSave` call (after line 253):
   ```typescript
   hebSstToken: hebSstToken || null,
   ```

4. Replace the HEB Integration section (lines 528-561) with:
   ```tsx
   {/* HEB Integration */}
   <div className="flex flex-col gap-3 pt-4 border-t border-border/40">
     <Label className="font-display text-base font-semibold">HEB Integration</Label>
     <p className="text-xs text-muted-foreground">
       Export grocery lists directly to your HEB shopping list. Find your tokens in browser DevTools at heb.com (Application → Cookies). The SST token lasts ~1 year; the SAT token auto-refreshes.
     </p>
     <div className="flex flex-col gap-2">
       <Label htmlFor="hebSstToken" className="text-sm">HEB SST Token</Label>
       <Input
         id="hebSstToken"
         type="password"
         value={hebSstToken}
         onChange={(e) => {
           setHebSstToken(e.target.value);
           setSaved(false);
         }}
         placeholder="Paste your sst cookie value (hs:sst:...)"
         className="rounded-lg"
       />
     </div>
     <div className="flex flex-col gap-2">
       <Label htmlFor="hebSessionToken" className="text-sm">HEB SAT Token</Label>
       <Input
         id="hebSessionToken"
         type="password"
         value={hebSessionToken}
         onChange={(e) => {
           setHebSessionToken(e.target.value);
           setSaved(false);
         }}
         placeholder="Paste your sat cookie value (auto-refreshed)"
         className="rounded-lg"
       />
     </div>
     <div className="flex flex-col gap-2">
       <Label htmlFor="hebStoreId" className="text-sm">HEB Store Number</Label>
       <Input
         id="hebStoreId"
         value={hebStoreId}
         onChange={(e) => {
           setHebStoreId(e.target.value);
           setSaved(false);
         }}
         placeholder="e.g. 727"
         className="rounded-lg w-32"
       />
     </div>
   </div>
   ```

**Step 3: Run build to verify no type errors**

Run: `npm run build`

Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/app/settings/actions.ts src/components/settings/household-form.tsx
git commit -m "feat: add SST token field to settings UI and actions"
```

---

### Task 5: Manual Integration Test

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Set tokens in settings**

Navigate to Settings, enter your `sst` cookie value in the SST field and `sat` cookie value in the SAT field. Save.

**Step 3: Export a grocery list**

Go to a weekly plan with a grocery list, click "Export to HEB". Verify:
- Export succeeds
- Shopping list appears on heb.com
- Check database: `hebSessionToken` and `hebSstToken` should be updated with fresh values

**Step 4: Wait 30+ minutes, export again**

After the SAT expires, export again. Verify it auto-refreshes and succeeds without needing to update settings.

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: HEB SST-based SAT auto-refresh complete"
```
