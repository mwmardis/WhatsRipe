# Flexible Meal Planning Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to remove individual meals, skip entire days, and generate plans starting from today instead of always Monday.

**Architecture:** Three server actions (`deleteMeal`, `skipDay`, updated `savePlan`) plus UI changes to meal cards and weekly view for swipe-to-dismiss and hover delete. Grocery list auto-recalculates after any removal. AI prompt updated to accept a variable number of days.

**Tech Stack:** Next.js server actions, Prisma, Zod schemas, React touch/pointer events, Tailwind CSS

---

### Task 1: `deleteMeal` Server Action

**Files:**
- Modify: `src/app/actions/meal-actions.ts`

**Step 1: Write the `deleteMeal` server action**

Add to the bottom of `src/app/actions/meal-actions.ts`:

```typescript
export async function deleteMeal(mealId: string) {
  // Find meal with its parent chain to get weeklyPlanId
  const meal = await db.meal.findUnique({
    where: { id: mealId },
    include: {
      dailyPlan: {
        include: { weeklyPlan: { include: { groceryList: true } } },
      },
    },
  });

  if (!meal) throw new Error("Meal not found");

  // Delete the meal
  await db.meal.delete({ where: { id: mealId } });

  // Recalculate grocery list if one exists
  const weeklyPlan = meal.dailyPlan.weeklyPlan;
  if (weeklyPlan.groceryList) {
    await recalculateGroceryList(weeklyPlan.id);
  }

  revalidatePath("/");
  revalidatePath("/groceries");
}
```

Add the required imports at the top of the file (add `revalidatePath` from `"next/cache"`).

**Step 2: Write the `recalculateGroceryList` helper**

Add this helper function in `src/app/actions/meal-actions.ts` (not exported — internal helper):

```typescript
import { generateGroceryList } from "./grocery-actions";

async function recalculateGroceryList(weeklyPlanId: string) {
  // Check if any meals remain
  const remainingMeals = await db.meal.findMany({
    where: { dailyPlan: { weeklyPlanId } },
  });

  if (remainingMeals.length === 0) {
    // No meals left — delete the grocery list entirely
    await db.groceryList.deleteMany({ where: { weeklyPlanId } });
    return;
  }

  // Regenerate grocery list from remaining meals
  await generateGroceryList(weeklyPlanId);
}
```

**Step 3: Run the build to verify no type errors**

Run: `npm run build`
Expected: Build succeeds with no errors in `meal-actions.ts`

**Step 4: Commit**

```bash
git add src/app/actions/meal-actions.ts
git commit -m "feat: add deleteMeal server action with grocery recalc"
```

---

### Task 2: `skipDay` Server Action

**Files:**
- Modify: `src/app/actions/plan-actions.ts`

**Step 1: Write the `skipDay` server action**

Add to `src/app/actions/plan-actions.ts`:

```typescript
import { revalidatePath } from "next/cache";

export async function skipDay(dailyPlanId: string) {
  // Find the daily plan with its parent weekly plan
  const dailyPlan = await db.dailyPlan.findUnique({
    where: { id: dailyPlanId },
    include: {
      meals: true,
      weeklyPlan: { include: { groceryList: true } },
    },
  });

  if (!dailyPlan) throw new Error("Daily plan not found");

  // Delete all meals for this day
  if (dailyPlan.meals.length > 0) {
    await db.meal.deleteMany({
      where: { dailyPlanId },
    });
  }

  // Recalculate grocery list if one exists
  if (dailyPlan.weeklyPlan.groceryList) {
    // Check if any meals remain in the weekly plan
    const remainingMeals = await db.meal.findMany({
      where: { dailyPlan: { weeklyPlanId: dailyPlan.weeklyPlanId } },
    });

    if (remainingMeals.length === 0) {
      await db.groceryList.deleteMany({
        where: { weeklyPlanId: dailyPlan.weeklyPlanId },
      });
    } else {
      const { generateGroceryList } = await import("./grocery-actions");
      await generateGroceryList(dailyPlan.weeklyPlanId);
    }
  }

  revalidatePath("/");
  revalidatePath("/groceries");
}
```

**Step 2: Run the build to verify no type errors**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/app/actions/plan-actions.ts
git commit -m "feat: add skipDay server action to remove all meals from a day"
```

---

### Task 3: Swipeable Meal Card

**Files:**
- Modify: `src/components/planner/meal-card.tsx`

**Step 1: Add swipe-to-dismiss and hover X to MealCard**

The MealCard is currently wrapped in a `<Link>`. We need to:
1. Add a delete button (X) that appears on hover (desktop)
2. Add swipe-left gesture handling (mobile) that reveals a delete zone
3. Call `deleteMeal` on confirm

Update `src/components/planner/meal-card.tsx`:

- Add new props: `onDelete?: (mealId: string) => void`
- Wrap the card content in a swipeable container using pointer events
- Add an X button positioned at top-right, visible on hover

```typescript
// Add to imports
import { useState, useRef } from "react";
import { X } from "lucide-react";

// Add to MealCardProps interface
onDelete?: (mealId: string) => void;

// Add to component body, before the return
const [swiped, setSwiped] = useState(false);
const [offsetX, setOffsetX] = useState(0);
const startX = useRef(0);
const isDragging = useRef(false);

const SWIPE_THRESHOLD = -80; // pixels to trigger delete

function handlePointerDown(e: React.PointerEvent) {
  if (!onDelete) return;
  startX.current = e.clientX;
  isDragging.current = true;
  (e.target as HTMLElement).setPointerCapture(e.pointerId);
}

function handlePointerMove(e: React.PointerEvent) {
  if (!isDragging.current) return;
  const diff = e.clientX - startX.current;
  if (diff < 0) setOffsetX(diff); // only allow left swipe
}

function handlePointerUp() {
  isDragging.current = false;
  if (offsetX < SWIPE_THRESHOLD) {
    setSwiped(true);
    onDelete?.(id);
  }
  setOffsetX(0);
}
```

For the JSX, wrap the existing card div in a container that handles pointer events:

```tsx
<div className="relative overflow-hidden rounded-xl">
  {/* Delete zone revealed on swipe */}
  {onDelete && (
    <div className="absolute inset-y-0 right-0 flex w-20 items-center justify-center bg-destructive text-destructive-foreground">
      <X className="h-5 w-5" />
    </div>
  )}

  <div
    style={{ transform: `translateX(${offsetX}px)`, transition: isDragging.current ? 'none' : 'transform 0.2s ease-out' }}
    onPointerDown={handlePointerDown}
    onPointerMove={handlePointerMove}
    onPointerUp={handlePointerUp}
  >
    <Link href={`/meal/${id}`} className="group" onClick={(e) => { if (Math.abs(offsetX) > 5) e.preventDefault(); }}>
      {/* existing card content */}
    </Link>
  </div>

  {/* Desktop hover delete button */}
  {onDelete && (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(id); }}
      className="absolute top-2 right-2 hidden group-hover:flex h-6 w-6 items-center justify-center rounded-full bg-muted/80 hover:bg-destructive hover:text-destructive-foreground transition-colors"
      aria-label="Remove meal"
    >
      <X className="h-3.5 w-3.5" />
    </button>
  )}
</div>
```

Note: The outer container needs `group` class for the hover delete button to work. Adjust the existing `group` class from the `<Link>` to the outer wrapper div.

**Step 2: Verify the component renders without errors**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/components/planner/meal-card.tsx
git commit -m "feat: add swipe-to-dismiss and hover X delete to MealCard"
```

---

### Task 4: Swipeable Day Header + Wire Up Weekly View

**Files:**
- Modify: `src/components/planner/weekly-view.tsx`

**Step 1: Add delete handlers and pass `onDelete` to MealCard**

Update `WeeklyViewProps` to accept callback props:

```typescript
interface WeeklyViewProps {
  weekStart: Date;
  dailyPlans: DailyPlanData[];
  children: ChildInfo[];
  weekLabel?: string;
  batchCookingSuggestions?: BatchCookingSuggestion[];
  mealPrepDay?: string;
  onDeleteMeal?: (mealId: string) => void;
  onSkipDay?: (dailyPlanId: string) => void;
}
```

Add destructured props `onDeleteMeal` and `onSkipDay`.

For each day header, add a hover X button (desktop) and swipe handler (mobile):

```tsx
{/* Day header */}
<div className="flex items-baseline gap-2.5 sticky top-0 bg-background/90 backdrop-blur-sm py-2.5 z-10 group/day">
  <h3 className="font-display text-lg font-semibold tracking-tight text-foreground">
    {DAY_NAMES[day.dayOfWeek]}
  </h3>
  <span className="text-sm text-muted-foreground font-medium">
    {formatDate(weekStart, day.dayOfWeek)}
  </span>
  {onSkipDay && day.meals.length > 0 && (
    <button
      onClick={() => onSkipDay(day.id)}
      className="ml-auto hidden group-hover/day:flex h-6 items-center gap-1 rounded-full px-2 text-xs text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
      aria-label={`Skip ${DAY_NAMES[day.dayOfWeek]}`}
    >
      <X className="h-3 w-3" />
      Skip day
    </button>
  )}
</div>
```

For empty days (no meals), show a simple empty state:

```tsx
{sortedMeals.length === 0 ? (
  <div className="flex items-center justify-center rounded-xl border border-dashed border-border/60 py-8 text-sm text-muted-foreground">
    No meals planned
  </div>
) : (
  <div className="flex flex-col gap-2.5">
    {sortedMeals.map((meal) => (
      <MealCard
        key={meal.id}
        {...meal}
        children={children}
        onDelete={onDeleteMeal}
      />
    ))}
  </div>
)}
```

Add `X` to the lucide-react imports.

**Step 2: Wire up the callbacks in the parent page**

Find the page that renders `WeeklyView` (likely `src/app/page.tsx` or similar). It will need a client wrapper component that calls the server actions:

Modify `src/app/page.tsx` — if it's a server component, create a thin client wrapper `src/components/planner/weekly-view-client.tsx` that:

```typescript
"use client";

import { WeeklyView } from "./weekly-view";
import { deleteMeal } from "@/app/actions/meal-actions";
import { skipDay } from "@/app/actions/plan-actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// ... same props as WeeklyView

export function WeeklyViewClient(props) {
  const router = useRouter();

  async function handleDeleteMeal(mealId: string) {
    try {
      await deleteMeal(mealId);
      router.refresh();
      toast.success("Meal removed");
    } catch {
      toast.error("Failed to remove meal");
    }
  }

  async function handleSkipDay(dailyPlanId: string) {
    try {
      await skipDay(dailyPlanId);
      router.refresh();
      toast.success("Day skipped");
    } catch {
      toast.error("Failed to skip day");
    }
  }

  return (
    <WeeklyView
      {...props}
      onDeleteMeal={handleDeleteMeal}
      onSkipDay={handleSkipDay}
    />
  );
}
```

Then update `src/app/page.tsx` to use `WeeklyViewClient` instead of `WeeklyView`.

**Step 3: Run the build**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/components/planner/weekly-view.tsx src/components/planner/weekly-view-client.tsx src/app/page.tsx
git commit -m "feat: wire up meal deletion and day skipping in weekly view"
```

---

### Task 5: Smart Mid-Week Generation — Schema Changes

**Files:**
- Modify: `src/lib/ai/schemas.ts`

**Step 1: Make `weeklyPlanSchema.days` accept variable length**

Currently `z.array(dailyPlanSchema).length(7)` — change to accept 1-7 days:

```typescript
export const weeklyPlanSchema = z.object({
  days: z.array(dailyPlanSchema).min(1).max(7),
  batchCookingSuggestions: z.array(batchCookingSuggestionSchema),
});
```

**Step 2: Run tests**

Run: `npm test`
Expected: All existing tests pass (schema change is backward-compatible — 7 days still valid)

**Step 3: Commit**

```bash
git add src/lib/ai/schemas.ts
git commit -m "feat: allow 1-7 days in weekly plan schema for mid-week generation"
```

---

### Task 6: Smart Mid-Week Generation — Prompt Changes

**Files:**
- Modify: `src/lib/ai/prompts.ts`

**Step 1: Add `startDayIndex` parameter to `buildWeeklyPlanPrompt`**

Update the function signature to accept an optional `startDayIndex`:

```typescript
export function buildWeeklyPlanPrompt(
  season: Season,
  seasonalIngredients: string[],
  household: HouseholdContext,
  children: Child[],
  mealTypes: { breakfast: boolean; lunch: boolean },
  useSeasonalFoods: boolean = true,
  startDayIndex: number = 0 // 0=Monday, 6=Sunday
): { system: string; user: string } {
```

Update the system prompt — change the "Always return exactly 7 days" line:

```typescript
const numDays = 7 - startDayIndex;
const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const startDayName = dayNames[startDayIndex];
const planDaysDescription = startDayIndex === 0
  ? "Always return exactly 7 days of meals (Monday through Sunday)."
  : `Return exactly ${numDays} days of meals (${startDayName} through Sunday).`;
```

Replace the hardcoded "Always return exactly 7 days..." with `${planDaysDescription}` in the system string.

Update the user prompt — change "Create a 7-day meal plan" to:

```typescript
const dayCount = 7 - startDayIndex;
const planLabel = startDayIndex === 0
  ? "a 7-day meal plan"
  : `a ${dayCount}-day meal plan (${startDayName} through Sunday)`;
```

Use `planLabel` in the user prompt where it currently says "a 7-day meal plan".

**Step 2: Run the build**

Run: `npm run build`
Expected: Build succeeds (parameter is optional with default, so no callers break)

**Step 3: Commit**

```bash
git add src/lib/ai/prompts.ts
git commit -m "feat: add startDayIndex to buildWeeklyPlanPrompt for mid-week planning"
```

---

### Task 7: Smart Mid-Week Generation — API Route + savePlan

**Files:**
- Modify: `src/app/api/generate-plan/route.ts`
- Modify: `src/app/actions/plan-actions.ts`

**Step 1: Calculate `startDayIndex` in the API route**

In `src/app/api/generate-plan/route.ts`, after line 11 (inside the try block), add:

```typescript
// For current week, start from today; for future weeks, start from Monday
const now = new Date();
const jsDay = now.getDay(); // 0=Sun, 1=Mon, ...
const startDayIndex = jsDay === 0 ? 6 : jsDay - 1; // Convert to 0=Mon, 6=Sun
```

Pass `startDayIndex` to `buildWeeklyPlanPrompt` as the last argument (line ~63-84):

```typescript
const { system, user } = buildWeeklyPlanPrompt(
  season,
  ingredientNames,
  { /* ...existing context... */ },
  household.children,
  { breakfast: household.planBreakfast, lunch: household.planLunch },
  household.useSeasonalFoods,
  startDayIndex // NEW: mid-week start
);
```

Include `startDayIndex` in the JSON response:

```typescript
return NextResponse.json({
  plan: object,
  season,
  householdId: household.id,
  planWeeks: household.planWeeks,
  startDayIndex, // NEW
});
```

**Step 2: Update `savePlan` to accept `startDayIndex`**

In `src/app/actions/plan-actions.ts`, update `savePlan`:

```typescript
export async function savePlan(
  householdId: string,
  weeklyPlanData: WeeklyPlanOutput,
  weekOffset: number = 0,
  startDayIndex: number = 0 // NEW: 0=Monday start, used for mid-week
) {
```

Change the loop from `for (let dayIndex = 0; dayIndex < 7; dayIndex++)` to:

```typescript
for (let i = 0; i < weeklyPlanData.days.length; i++) {
  const dayIndex = startDayIndex + i; // actual day of week
  const dayData = weeklyPlanData.days[i];

  const dailyPlan = await db.dailyPlan.create({
    data: {
      weeklyPlanId: weeklyPlan.id,
      dayOfWeek: dayIndex,
    },
  });

  // ... rest of meal creation stays the same
```

**Step 3: Update `GenerateButton` to pass `startDayIndex`**

In `src/components/planner/generate-button.tsx`, update the `savePlan` call:

```typescript
// Save first week (with mid-week start for week 0)
await savePlan(data.householdId, data.plan, 0, data.startDayIndex ?? 0);

// Additional weeks always start from Monday
for (let week = 1; week < planWeeks; week++) {
  const weekResponse = await fetch("/api/generate-plan", { method: "POST" });
  if (weekResponse.ok) {
    const weekData = await weekResponse.json();
    await savePlan(data.householdId, weekData.plan, week, 0);
  }
}
```

**Step 4: Run the build**

Run: `npm run build`
Expected: Build succeeds

**Step 5: Manual smoke test**

Run: `npm run dev`
- Generate a plan mid-week — should only show today through Sunday
- Generate a plan on Monday — should show full Mon-Sun
- Verify grocery list generates correctly for partial weeks

**Step 6: Commit**

```bash
git add src/app/api/generate-plan/route.ts src/app/actions/plan-actions.ts src/components/planner/generate-button.tsx
git commit -m "feat: smart mid-week generation starts from today instead of Monday"
```

---

### Task 8: Update Generate Button Label

**Files:**
- Modify: `src/components/planner/generate-button.tsx`

**Step 1: Make button label context-aware**

The button currently always says "Generate This Week". Update it to reflect mid-week:

```typescript
const now = new Date();
const jsDay = now.getDay();
const todayIndex = jsDay === 0 ? 6 : jsDay - 1;
const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const buttonLabel = todayIndex === 0
  ? "Generate This Week"
  : `Generate ${dayNames[todayIndex]}–Sunday`;
```

Use `buttonLabel` in the button text where it currently says `"Generate This Week"`.

**Step 2: Run the build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/components/planner/generate-button.tsx
git commit -m "feat: context-aware generate button label for mid-week planning"
```

---

### Task 9: End-to-End Manual Testing

**Files:** None (testing only)

**Step 1: Start the dev server**

Run: `npm run dev`

**Step 2: Test meal deletion**

1. Generate a plan (or use existing)
2. On desktop: hover over a meal card, click the X button — meal should disappear
3. On mobile (or touch simulation): swipe a meal card left — meal should disappear
4. Check the grocery list page — it should have been recalculated without the removed meal's ingredients

**Step 3: Test day skipping**

1. Hover over a day header, click "Skip day"
2. Day should show "No meals planned" empty state
3. Grocery list should recalculate

**Step 4: Test mid-week generation**

1. Delete existing plan
2. Generate a new plan — should only show today through Sunday
3. Verify correct number of days in the weekly view
4. Verify grocery list generates for the partial week only

**Step 5: Commit any fixes**

If any issues found, fix and commit with descriptive messages.

---

### Task 10: Final Build Verification

**Step 1: Run full build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 2: Run tests**

Run: `npm test`
Expected: All tests pass

**Step 3: Final commit if needed**

Only if there are outstanding changes.
