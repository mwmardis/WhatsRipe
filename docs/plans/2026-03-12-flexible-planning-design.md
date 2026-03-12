# Flexible Meal Planning Design

**Date:** 2026-03-12
**Status:** Approved

## Problem

The app treats weekly meal plans as rigid, atomic units. Users cannot:
- Remove individual meals from specific days
- Skip entire days (e.g., eating out)
- Generate plans starting from today instead of always Monday

## Approach

**Hard Delete** — removed meals and skipped days are permanently deleted from the database. No soft-delete flags, no undo. Grocery list auto-recalculates after any removal.

## Feature 1: Remove Individual Meals

**Interaction:** Swipe-to-dismiss on meal cards (mobile), hover X button (desktop fallback).

**Backend:** `deleteMeal` server action:
1. Delete the `Meal` record by ID
2. Trigger grocery list recalculation for the parent `WeeklyPlan`
3. If the `DailyPlan` has no remaining meals, keep the empty `DailyPlan` row (day still shows in UI, just empty)

**Grocery recalc:** Query all remaining meals in the `WeeklyPlan`, parse their recipe ingredients, diff against current `GroceryItem` records, and remove items no longer needed by any meal.

## Feature 2: Skip Entire Day

**Interaction:** Swipe-to-dismiss on the day header/container (mobile), hover X button on the day header (desktop fallback).

**Backend:** `skipDay` server action:
1. Delete all `Meal` records for the given `DailyPlan`
2. Keep the empty `DailyPlan` row so the day still appears in the weekly view
3. Trigger the same grocery list recalculation as meal removal

**UI for empty days:** Day card shows day name and date with a "No meals planned" state. To get meals back, use existing meal swap/alternative generation or regenerate the plan.

## Feature 3: Smart Mid-Week Generation

**Current behavior:** `savePlan` always generates Mon-Sun regardless of what day it is.

**New behavior:** When generating a plan for the current week (`weekOffset = 0`):
1. Determine today's day index (Mon=0 ... Sun=6)
2. Only request meals from today through Sunday in the AI prompt
3. Only create `DailyPlan` + `Meal` records for remaining days
4. Future weeks (`weekOffset >= 1`) still generate full Mon-Sun

**Prompt adjustment:** `buildWeeklyPlanPrompt` accepts a `startDay` parameter. When mid-week, the prompt says "plan meals for Wednesday through Sunday" instead of the full week.

**Edge case:** If a plan already exists for this week, no auto-merge. User deletes the old plan and generates fresh from today forward.

## Key Decisions

- **Hard delete, no undo** — simplest model, aligns with user preference
- **Empty DailyPlan rows preserved** — keeps 7-day visual consistency in weekly view
- **Grocery auto-recalc** — no manual intervention needed after removals
- **No schema changes needed** — existing models support all operations (delete Meal/DailyPlan records)
