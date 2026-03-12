# WhatsRipe Enhancements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 6 incremental enhancements to WhatsRipe — model swap, age fix, feedback learning, meal prep intelligence, image generation, and HEB grocery export.

**Architecture:** Each feature is independent and ships with its own commit. Pure incremental — no feature depends on another. Tests use Vitest with path aliases already configured.

**Tech Stack:** Next.js 16, React 19, Prisma 7 (PostgreSQL), Vercel AI SDK v6, @ai-sdk/google (Gemini), Tailwind CSS 4, shadcn/ui, Vitest

---

### Task 1: Swap AI Model to gemini-3.1-flash-lite-preview

**Files:**
- Modify: `src/lib/ai/provider.ts:9`

**Step 1: Update the model string**

In `src/lib/ai/provider.ts`, change line 9:

```ts
// Before:
return google("gemini-2.5-flash");

// After:
return google("gemini-3.1-flash-lite-preview");
```

Also update the JSDoc comment on line 5:

```ts
// Before:
 * Uses Google Gemini 2.0 Flash (free tier available).
// After:
 * Uses Google Gemini 3.1 Flash Lite Preview.
```

**Step 2: Commit**

```bash
git add src/lib/ai/provider.ts
git commit -m "feat: swap AI model to gemini-3.1-flash-lite-preview"
```

---

### Task 2: Fix Child Age Calculation

**Files:**
- Modify: `src/lib/food-stages.ts:5-14`
- Modify: `src/lib/ai/prompts.ts:34-35`
- Create: `src/lib/__tests__/food-stages.test.ts`

**Step 1: Write failing tests for age calculation**

Create `src/lib/__tests__/food-stages.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { getFoodStage } from "../food-stages";

describe("getFoodStage", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 6-12mo for a 3-month-old", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15"));
    const birthdate = new Date("2026-03-15");
    expect(getFoodStage(birthdate)).toBe("6-12mo");
  });

  it("returns 6-12mo for a 9-month-old", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-12-15"));
    const birthdate = new Date("2026-03-15");
    expect(getFoodStage(birthdate)).toBe("6-12mo");
  });

  it("returns 12-18mo for a 14-month-old", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-05-15"));
    const birthdate = new Date("2026-03-15");
    expect(getFoodStage(birthdate)).toBe("12-18mo");
  });

  it("returns 18-24mo for a 20-month-old", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-11-15"));
    const birthdate = new Date("2026-03-15");
    expect(getFoodStage(birthdate)).toBe("18-24mo");
  });

  it("returns 24mo+ for a 30-month-old", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2028-09-15"));
    const birthdate = new Date("2026-03-15");
    expect(getFoodStage(birthdate)).toBe("24mo+");
  });

  it("handles edge case: born Jan 31, checked Feb 1 (should be 0 months, not 1)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-01"));
    const birthdate = new Date("2026-01-31");
    // Only 1 day old — should be under 6 months, so "6-12mo"
    expect(getFoodStage(birthdate)).toBe("6-12mo");
  });

  it("handles edge case: born Dec 31, checked Jan 1 next year", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-01-01"));
    const birthdate = new Date("2026-12-31");
    // Only 1 day old
    expect(getFoodStage(birthdate)).toBe("6-12mo");
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npx vitest run src/lib/__tests__/food-stages.test.ts
```

Expected: The edge case test "born Jan 31, checked Feb 1" should fail because the current code calculates `(2026-2026)*12 + (1-0) = 1 month` when the child is actually only 1 day old.

**Step 3: Fix getFoodStage in food-stages.ts**

Replace lines 5-14 of `src/lib/food-stages.ts`:

```ts
export function getFoodStage(birthdate: Date): FoodStage {
  const now = new Date();
  const ageInDays = (now.getTime() - birthdate.getTime()) / (1000 * 60 * 60 * 24);
  const ageInMonths = Math.floor(ageInDays / 30.4375);
  if (ageInMonths < 6) return "6-12mo"; // treat under-6mo same as 6-12mo
  if (ageInMonths < 12) return "6-12mo";
  if (ageInMonths < 18) return "12-18mo";
  if (ageInMonths < 24) return "18-24mo";
  return "24mo+";
}
```

**Step 4: Fix age calculation in prompts.ts**

Replace lines 34-35 of `src/lib/ai/prompts.ts`:

```ts
// Before:
    const ageMonths = Math.floor(
      (Date.now() - child.birthdate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    );

// After:
    const ageMonths = Math.floor(
      (Date.now() - child.birthdate.getTime()) / (1000 * 60 * 60 * 24 * 30.4375)
    );
```

**Step 5: Run tests to verify they pass**

```bash
npx vitest run src/lib/__tests__/food-stages.test.ts
```

Expected: All 7 tests PASS.

**Step 6: Commit**

```bash
git add src/lib/food-stages.ts src/lib/ai/prompts.ts src/lib/__tests__/food-stages.test.ts
git commit -m "fix: correct child age calculation using day-based math"
```

---

### Task 3: Feedback Learning — Wire Meal Ratings Into Plan Prompts

**Files:**
- Modify: `src/lib/ai/prompts.ts:110-119` (the `mealHistory` section of `buildFamilyFeaturesContext`)
- Modify: `src/app/api/generate-plan/route.ts:41-49`

**Step 1: Verify existing mealHistory handling in prompts.ts**

The prompt builder at `src/lib/ai/prompts.ts:110-119` already handles `mealHistory` with loved/refused filtering. This code is correct and sufficient.

The issue is in `src/app/api/generate-plan/route.ts:41-49` — the query fetches ratings but doesn't filter by household or time window.

**Step 2: Update the meal ratings query in route.ts**

Replace lines 41-49 of `src/app/api/generate-plan/route.ts`:

```ts
// Before:
    const mealRatings = await db.mealRating.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { mealName: true, rating: true },
    });

// After:
    // Get recent meal ratings (last 30 days, max 50) for feedback learning
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const mealRatings = await db.mealRating.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        rating: { in: ["loved", "refused"] }, // skip "ok" — neutral signal
        meal: {
          dailyPlan: {
            weeklyPlan: { householdId: household.id },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { mealName: true, rating: true },
    });
```

**Step 3: Enhance the prompt text for feedback context**

Replace lines 110-119 of `src/lib/ai/prompts.ts`:

```ts
  if (household.mealHistory && household.mealHistory.length > 0) {
    const loved = household.mealHistory.filter((m) => m.rating === "loved").map((m) => m.name);
    const refused = household.mealHistory.filter((m) => m.rating === "refused").map((m) => m.name);
    if (loved.length > 0) {
      parts.push(`FAMILY FAVORITES (generate meals with similar flavors, ingredients, and cooking styles): ${loved.join(", ")}.`);
    }
    if (refused.length > 0) {
      parts.push(`MEALS FAMILY REFUSED (avoid these and meals with similar flavor profiles or main ingredients): ${refused.join(", ")}.`);
    }
  }
```

**Step 4: Commit**

```bash
git add src/app/api/generate-plan/route.ts src/lib/ai/prompts.ts
git commit -m "feat: feed meal rating history into plan generation prompts"
```

---

### Task 4: Meal Prep Intelligence — Batch Cooking Suggestions

**Files:**
- Modify: `src/lib/ai/schemas.ts:27-29`
- Modify: `src/lib/ai/prompts.ts:139-155` (system prompt in `buildWeeklyPlanPrompt`)
- Modify: `src/components/planner/weekly-view.tsx`
- Modify: `src/app/api/generate-plan/route.ts` (pass through new schema data)
- Modify: `src/app/page.tsx` (pass batchCookingSuggestions to WeeklyView)

**Step 1: Add batchCookingSuggestions to the Zod schema**

In `src/lib/ai/schemas.ts`, replace lines 27-33:

```ts
export const batchCookingSuggestionSchema = z.object({
  component: z.string(),
  usedInMeals: z.array(z.string()),
  prepInstructions: z.string(),
  timesSaved: z.string(),
});

export const weeklyPlanSchema = z.object({
  days: z.array(dailyPlanSchema).length(7),
  batchCookingSuggestions: z.array(batchCookingSuggestionSchema),
});

export type MealOutput = z.infer<typeof mealSchema>;
export type DailyPlanOutput = z.infer<typeof dailyPlanSchema>;
export type WeeklyPlanOutput = z.infer<typeof weeklyPlanSchema>;
export type BatchCookingSuggestion = z.infer<typeof batchCookingSuggestionSchema>;
```

**Step 2: Add batch cooking instructions to the system prompt**

In `src/lib/ai/prompts.ts`, at the end of the `system` string in `buildWeeklyPlanPrompt` (after the `kidCookingTasks` line, around line 155), add:

```ts

Also analyze the complete weekly plan and provide batch cooking suggestions. Identify ingredients or components that appear in multiple meals across the week. For each, suggest how to prepare them in advance to save time. Include what to prep, which meals use it, how to store it, and estimated time savings.`;
```

**Step 3: Update WeeklyView to accept and display batch cooking suggestions**

In `src/components/planner/weekly-view.tsx`, add the new prop and component. Add this interface and update `WeeklyViewProps`:

```ts
interface BatchCookingSuggestion {
  component: string;
  usedInMeals: string[];
  prepInstructions: string;
  timesSaved: string;
}

interface WeeklyViewProps {
  weekStart: Date;
  dailyPlans: DailyPlanData[];
  children: ChildInfo[];
  weekLabel?: string;
  batchCookingSuggestions?: BatchCookingSuggestion[];
  mealPrepDay?: string;
}
```

Then add a collapsible "Prep Day Plan" section at the top of the `WeeklyView` return, before the day-by-day list:

```tsx
import { ChevronDown, ChevronUp, Timer } from "lucide-react";
import { useState } from "react";

// Inside WeeklyView component, before the dailyPlans.map:
const [prepExpanded, setPrepExpanded] = useState(false);

// In the JSX, before the dailyPlans.map block:
{batchCookingSuggestions && batchCookingSuggestions.length > 0 && (
  <div className="rounded-xl border border-border/60 bg-card p-4">
    <button
      onClick={() => setPrepExpanded(!prepExpanded)}
      className="flex w-full items-center justify-between"
    >
      <div className="flex items-center gap-2">
        <Timer className="h-4 w-4 text-accent" />
        <h3 className="font-display text-base font-semibold">
          {mealPrepDay ? `${mealPrepDay} Prep Plan` : "Batch Cooking Plan"}
        </h3>
        <span className="text-xs text-muted-foreground">
          {batchCookingSuggestions.length} suggestions
        </span>
      </div>
      {prepExpanded ? (
        <ChevronUp className="h-4 w-4 text-muted-foreground" />
      ) : (
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
    {prepExpanded && (
      <ul className="mt-3 flex flex-col gap-3">
        {batchCookingSuggestions.map((suggestion, i) => (
          <li key={i} className="flex flex-col gap-1 rounded-lg bg-muted/40 p-3">
            <div className="flex items-baseline justify-between">
              <span className="font-medium text-sm">{suggestion.component}</span>
              <span className="text-xs text-muted-foreground">{suggestion.timesSaved}</span>
            </div>
            <p className="text-sm text-muted-foreground">{suggestion.prepInstructions}</p>
            <p className="text-xs text-muted-foreground/70">
              Used in: {suggestion.usedInMeals.join(", ")}
            </p>
          </li>
        ))}
      </ul>
    )}
  </div>
)}
```

**Step 4: Wire batchCookingSuggestions through the data flow**

Check `src/app/page.tsx` — the main planner page fetches the plan and renders `WeeklyView`. The `batchCookingSuggestions` will now be part of the generated plan object. You need to:

1. Store `batchCookingSuggestions` as a JSON field on `WeeklyPlan` model (or pass it through the API response and store client-side)
2. Pass it to `<WeeklyView batchCookingSuggestions={...} />`

The simplest approach: add `batchCookingSuggestions String? // JSON` to the `WeeklyPlan` model in `prisma/schema.prisma` and save it when the plan is generated.

In `prisma/schema.prisma`, add to the `WeeklyPlan` model (after line 49):

```prisma
  batchCookingSuggestions String? // JSON array of batch cooking suggestions
```

Run migration:

```bash
npx prisma migrate dev --name add-batch-cooking-suggestions
```

In the plan saving logic (find where `WeeklyPlan` is created — check `src/app/actions/plan-actions.ts` or the page that handles saving), store:

```ts
batchCookingSuggestions: JSON.stringify(object.batchCookingSuggestions)
```

Then in the page that reads the plan, parse it and pass to `WeeklyView`:

```ts
const batchCookingSuggestions = plan.batchCookingSuggestions
  ? JSON.parse(plan.batchCookingSuggestions)
  : [];
```

**Step 5: Commit**

```bash
git add src/lib/ai/schemas.ts src/lib/ai/prompts.ts src/components/planner/weekly-view.tsx prisma/schema.prisma src/app/page.tsx
git commit -m "feat: add batch cooking suggestions to weekly meal plans"
```

---

### Task 5: Image Generation — Lazy Imagen with DB Cache

**Files:**
- Modify: `prisma/schema.prisma` (add `imageUrl` to Meal model)
- Create: `src/app/api/generate-image/route.ts`
- Create: `src/components/meal/meal-image.tsx`
- Modify: `src/app/meal/[id]/page.tsx`

**Step 1: Add imageUrl to the Meal model**

In `prisma/schema.prisma`, add to the `Meal` model (after line 85, the `kidCookingTasks` field):

```prisma
  imageUrl            String?      // cached AI-generated image (base64 data URL)
```

Run migration:

```bash
npx prisma migrate dev --name add-meal-image-url
```

**Step 2: Create the image generation API route**

Create `src/app/api/generate-image/route.ts`:

```ts
import { NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { mealId } = await request.json();

    if (!mealId) {
      return NextResponse.json({ error: "mealId is required" }, { status: 400 });
    }

    // Check if image already exists
    const meal = await db.meal.findUnique({
      where: { id: mealId },
      select: { id: true, name: true, description: true, imageUrl: true },
    });

    if (!meal) {
      return NextResponse.json({ error: "Meal not found" }, { status: 404 });
    }

    if (meal.imageUrl) {
      return NextResponse.json({ imageUrl: meal.imageUrl });
    }

    // Generate image using Gemini's image generation
    const model = google("gemini-2.0-flash-exp", { useSearchGrounding: false });

    const { files } = await generateText({
      model,
      providerOptions: {
        google: { responseModalities: ["TEXT", "IMAGE"] },
      },
      prompt: `Generate an appetizing overhead food photography image of this dish: "${meal.name}" - ${meal.description}. Natural lighting, rustic wooden table, family-style plating. No text, labels, or watermarks.`,
    });

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No image generated" },
        { status: 500 }
      );
    }

    const imageFile = files[0];
    const imageUrl = `data:${imageFile.mimeType};base64,${imageFile.base64}`;

    // Cache in database
    await db.meal.update({
      where: { id: mealId },
      data: { imageUrl },
    });

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Image generation failed:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to generate image", details: message },
      { status: 500 }
    );
  }
}
```

> **Note:** The exact Gemini image generation API may differ. Check the `@ai-sdk/google` docs for the correct model name and image generation method. The above uses `generateText` with `responseModalities: ["IMAGE"]` which is the Vercel AI SDK pattern for Gemini image output. If this doesn't work, try the `experimental_generateImage` function from the `ai` package instead.

**Step 3: Create the MealImage client component**

Create `src/components/meal/meal-image.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { Loader2, ImageIcon } from "lucide-react";

export function MealImage({ mealId, initialImageUrl }: { mealId: string; initialImageUrl: string | null }) {
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (imageUrl || loading || error) return;

    setLoading(true);
    fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mealId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.imageUrl) {
          setImageUrl(data.imageUrl);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [mealId, imageUrl, loading, error]);

  if (error) return null; // Silently fail — image is optional

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl bg-muted/50 h-48 w-full">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-xs">Generating image...</span>
        </div>
      </div>
    );
  }

  if (!imageUrl) return null;

  return (
    <div className="relative rounded-xl overflow-hidden">
      <img
        src={imageUrl}
        alt="AI generated meal photo"
        className="w-full h-48 object-cover rounded-xl"
      />
      <span className="absolute bottom-2 right-2 text-[10px] bg-black/50 text-white/80 px-1.5 py-0.5 rounded-full">
        AI generated
      </span>
    </div>
  );
}
```

**Step 4: Add MealImage to the meal detail page**

In `src/app/meal/[id]/page.tsx`, add the image component after the back button and before the meal header (between lines 65 and 68):

```tsx
import { MealImage } from "@/components/meal/meal-image";

// In the JSX, after the Back button and before the meal header div:
<MealImage mealId={meal.id} initialImageUrl={meal.imageUrl ?? null} />
```

Also update the `getMeal` query (in `src/app/actions/meal-actions.ts`) to include `imageUrl` in the select if it uses a select clause.

**Step 5: Commit**

```bash
git add prisma/schema.prisma src/app/api/generate-image/route.ts src/components/meal/meal-image.tsx src/app/meal/[id]/page.tsx
git commit -m "feat: add lazy AI image generation for meals with DB caching"
```

---

### Task 6: HEB Grocery Export

**Files:**
- Modify: `prisma/schema.prisma` (add HEB fields to HouseholdProfile)
- Create: `src/lib/heb-client.ts`
- Create: `src/app/api/export-heb/route.ts`
- Modify: `src/components/settings/household-form.tsx`
- Modify: `src/components/groceries/grocery-list-view.tsx`

**Step 1: Add HEB settings to the database schema**

In `prisma/schema.prisma`, add to `HouseholdProfile` (after `calendarExportEnabled` on line 25):

```prisma
  hebSessionToken       String?  // HEB sst cookie value for API auth
  hebStoreId            String?  // HEB store number (e.g. "727")
```

Run migration:

```bash
npx prisma migrate dev --name add-heb-settings
```

**Step 2: Create the HEB GraphQL client**

Create `src/lib/heb-client.ts`:

```ts
const HEB_GRAPHQL_URL = "https://www.heb.com/graphql";

const HASHES = {
  createShoppingList: "e79d5dcdfc241ae8692f04c8776611f1c720a4c79f57ebc35519eb22ace0d5db",
  addToShoppingListV2: "3706ce43a3800c3d3085bf695fc141845d08e20c5dad21fbdd936aebe0b51320",
} as const;

interface HebConfig {
  sessionToken: string;
  storeId: string;
}

async function hebGraphQL(config: HebConfig, operations: unknown[]) {
  const res = await fetch(HEB_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: `sst=${config.sessionToken}`,
    },
    body: JSON.stringify(operations),
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error("HEB session expired. Please update your HEB token in settings.");
    }
    throw new Error(`HEB API error: ${res.status}`);
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

  const listId = response?.[0]?.data?.createShoppingListV2?.id;
  if (!listId) {
    throw new Error("Failed to create HEB shopping list");
  }
  return listId;
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

**Step 3: Create the HEB export API route**

Create `src/app/api/export-heb/route.ts`:

```ts
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
```

**Step 4: Add HEB settings fields to the household form**

In `src/components/settings/household-form.tsx`, add two new fields at the bottom of the settings form (before the Save button):

```tsx
{/* HEB Integration */}
<div className="flex flex-col gap-3 pt-4 border-t border-border/60">
  <Label className="font-display text-base font-semibold">HEB Integration</Label>
  <p className="text-xs text-muted-foreground">
    Export grocery lists directly to your HEB shopping list. Find your session token in your browser cookies (sst value) at heb.com.
  </p>
  <div className="flex flex-col gap-2">
    <Label htmlFor="hebSessionToken" className="text-sm">HEB Session Token</Label>
    <Input
      id="hebSessionToken"
      type="password"
      value={hebSessionToken}
      onChange={(e) => setHebSessionToken(e.target.value)}
      placeholder="Paste your sst cookie value"
    />
  </div>
  <div className="flex flex-col gap-2">
    <Label htmlFor="hebStoreId" className="text-sm">HEB Store Number</Label>
    <Input
      id="hebStoreId"
      value={hebStoreId}
      onChange={(e) => setHebStoreId(e.target.value)}
      placeholder="e.g. 727"
    />
  </div>
</div>
```

Add state variables and include them in the form submission. Also update the `HouseholdData` interface and the `updateHousehold` server action to handle these new fields.

**Step 5: Add "Export to HEB" button on grocery list page**

In `src/components/groceries/grocery-list-view.tsx`, add an export button in the toolbar (around line 131, after the Regenerate button):

```tsx
import { ExternalLink } from "lucide-react";

// Add state:
const [exporting, setExporting] = useState(false);

// Add button after the Regenerate button:
<Button
  variant="outline"
  size="sm"
  onClick={async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/export-heb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groceryListId: groceryList.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Export failed");
        return;
      }
      toast.success(`Exported ${data.itemCount} items to HEB`, {
        action: {
          label: "Open HEB",
          onClick: () => window.open(data.listUrl, "_blank"),
        },
      });
    } catch {
      toast.error("Failed to export to HEB");
    } finally {
      setExporting(false);
    }
  }}
  disabled={exporting}
  className="rounded-lg"
>
  {exporting ? (
    <>
      <Loader2 className="size-3.5 mr-1 animate-spin" />
      Exporting...
    </>
  ) : (
    <>
      <ExternalLink className="size-3.5 mr-1" />
      Export to HEB
    </>
  )}
</Button>
```

**Step 6: Commit**

```bash
git add prisma/schema.prisma src/lib/heb-client.ts src/app/api/export-heb/route.ts src/components/settings/household-form.tsx src/components/groceries/grocery-list-view.tsx
git commit -m "feat: add HEB grocery list export via GraphQL API"
```

---

### Task 7: Export-Friendly Grocery Lists (Copy to Clipboard)

**Files:**
- Modify: `src/components/groceries/grocery-list-view.tsx`

**Step 1: Add a "Copy List" button to the grocery toolbar**

In `src/components/groceries/grocery-list-view.tsx`, add a copy button in the toolbar area (around line 112):

```tsx
import { Copy } from "lucide-react";

// Add a helper function inside the component:
function formatListForClipboard(items: GroceryItemData[]): string {
  const grouped: Record<string, GroceryItemData[]> = {};
  for (const item of items.filter((i) => !i.checked)) {
    if (!grouped[item.storeSection]) grouped[item.storeSection] = [];
    grouped[item.storeSection].push(item);
  }

  const sectionLabels: Record<string, string> = {
    produce: "Produce",
    dairy: "Dairy & Eggs",
    meat: "Meat & Seafood",
    pantry: "Pantry",
    frozen: "Frozen",
  };

  return SECTION_ORDER
    .filter((s) => grouped[s]?.length)
    .map((section) => {
      const label = sectionLabels[section] || section;
      const items = grouped[section]
        .map((i) => `  [ ] ${i.name} (${i.quantity} ${i.unit})`)
        .join("\n");
      return `${label}:\n${items}`;
    })
    .join("\n\n");
}

// Add the button in the toolbar, alongside the existing buttons:
<Button
  variant="outline"
  size="sm"
  className="rounded-lg"
  onClick={async () => {
    const text = formatListForClipboard(groceryList.items);
    await navigator.clipboard.writeText(text);
    toast.success("Grocery list copied to clipboard");
  }}
>
  <Copy className="size-3.5 mr-1" />
  Copy List
</Button>
```

**Step 2: Commit**

```bash
git add src/components/groceries/grocery-list-view.tsx
git commit -m "feat: add copy-to-clipboard for formatted grocery lists"
```

---

## Summary of All Tasks

| Task | Feature | Key Files | Estimated Steps |
|------|---------|-----------|-----------------|
| 1 | Model swap | `provider.ts` | 2 |
| 2 | Age calculation fix | `food-stages.ts`, `prompts.ts`, tests | 6 |
| 3 | Feedback learning | `route.ts`, `prompts.ts` | 4 |
| 4 | Meal prep intelligence | `schemas.ts`, `prompts.ts`, `weekly-view.tsx`, schema | 5 |
| 5 | Image generation | New API route, new component, schema | 5 |
| 6 | HEB grocery export | New client, new API route, settings, grocery UI, schema | 6 |
| 7 | Copy to clipboard | `grocery-list-view.tsx` | 2 |
