# Design: Seasonal Toggle & Baby Led Weaning Support

**Date:** 2026-02-26
**Status:** Approved

## Problem

1. Users cannot disable season-based meal recommendations. The AI always prioritizes seasonal ingredients, which may not match user preferences (e.g., availability, climate differences, personal taste).
2. Baby food stages are rigidly tied to age — a 7-month-old always gets "Purees & soft solids" recommendations. There's no way to indicate baby led weaning (BLW), where babies eat soft finger foods from the start instead of purees.

## Design

### Feature 1: Seasonal Preference Toggle

**Data model:** Add `useSeasonalFoods Boolean @default(true)` to `HouseholdProfile`.

**Settings UI:** A toggle switch in the Household Form, alongside the existing breakfast/lunch toggles. Label: "Feature seasonal ingredients" with description text like "Prioritize what's fresh and in season."

**AI prompt behavior:**
- `useSeasonalFoods = true` (default): Current behavior — season name, seasonal ingredient list, and "feature at least one seasonal ingredient" instruction included in prompts.
- `useSeasonalFoods = false`: Seasonal context omitted entirely from AI prompts. No seasonal bias in meal generation.

**UI behavior:**
- `SeasonIndicator` component on the planner page hides when `useSeasonalFoods` is `false`.

### Feature 2: Baby Feeding Approach

**Data model:** Add `feedingApproach String @default("combination")` to `Child`. Valid values: `"traditional"`, `"blw"`, `"combination"`.

**Who sees the selector:** Only shown for children under 24 months (food stages `6-12mo`, `12-18mo`, `18-24mo`). Hidden for `24mo+` children.

**Settings UI:** In the ChildrenManager add/edit dialogs, a radio group or segmented control appears below the birthdate field when the child qualifies. Options:
- **Traditional** — "Purees and soft solids first"
- **Baby Led Weaning** — "Finger foods from the start"
- **Combination** — "Both purees and finger foods" (default, pre-selected)

**Existing data migration:** All existing `Child` records get `feedingApproach = "combination"` as the default value. Existing users immediately get both puree and finger food suggestions with no action required.

**AI prompt changes:** Child context in prompts changes from:
```
- Emma: food stage "6-12mo" (Purees & soft solids). Allergies: milk.
```
to:
```
- Emma: food stage "6-12mo", feeding approach: combination. Allergies: milk.
```

Baby adaptation instructions vary by approach:
- **Traditional:** "Provide puree/mash instructions appropriate for their stage."
- **BLW:** "Provide finger food suggestions with safe sizes and soft-cooked textures. Do not suggest purees."
- **Combination:** "Provide BOTH a puree/mash version AND a finger food version side by side, so the parent can choose."

**Food stage labels:** The label for stages below `24mo+` becomes approach-aware:
- `6-12mo` Traditional: "Purees & soft solids"
- `6-12mo` BLW: "Soft finger foods"
- `6-12mo` Combination: "Purees & finger foods"
- Similar adjustments for `12-18mo` and `18-24mo`.

## Changes Summary

| Area | Change |
|------|--------|
| Prisma schema | Add `useSeasonalFoods` to `HouseholdProfile`, `feedingApproach` to `Child` |
| Settings actions | `updateHousehold` accepts `useSeasonalFoods`. `addChild`/`updateChild` accept `feedingApproach` |
| Household Form | New toggle for seasonal preference |
| Children Manager | Feeding approach selector in add/edit dialogs (conditional on age) |
| Food stages | `getFoodStageLabel()` becomes approach-aware for stages below `24mo+` |
| AI prompts | `buildWeeklyPlanPrompt` conditionally includes seasonal context. `buildRecipePrompt` and `buildSwapPrompt` pass feeding approach per child and adjust adaptation instructions |
| SeasonIndicator | Hidden when `useSeasonalFoods` is `false` |
| Tests | Update season tests for toggle. Add tests for feeding approach logic and labels |

## What Stays the Same

- Season detection logic (`getCurrentSeason()`)
- Seasonal ingredient database
- Grocery list generation
- Meal card display
- Overall planner flow
