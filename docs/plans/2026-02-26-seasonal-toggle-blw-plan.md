# Seasonal Toggle & Baby Led Weaning Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to disable seasonal ingredient recommendations and select a feeding approach (traditional, BLW, combination) per child.

**Architecture:** Two independent features sharing the same settings flow. Feature 1 adds a boolean to HouseholdProfile and conditionally removes seasonal context from AI prompts. Feature 2 adds a feedingApproach field to Child, makes food stage labels approach-aware, and adjusts AI baby adaptation instructions per approach.

**Tech Stack:** Next.js 15, Prisma (SQLite), TypeScript, Vitest, shadcn/ui, Google Gemini AI

---

### Task 1: Prisma Schema — Add `useSeasonalFoods` and `feedingApproach`

**Files:**
- Modify: `prisma/schema.prisma:9-21` (HouseholdProfile model)
- Modify: `prisma/schema.prisma:23-32` (Child model)

**Step 1: Add fields to schema**

In `prisma/schema.prisma`, add `useSeasonalFoods` to HouseholdProfile:

```prisma
model HouseholdProfile {
  id                  String   @id @default(cuid())
  dietaryPreferences  String   @default("[]")
  allergies           String   @default("[]")
  likedIngredients    String   @default("[]")
  dislikedIngredients String   @default("[]")
  planBreakfast       Boolean  @default(false)
  planLunch           Boolean  @default(false)
  useSeasonalFoods    Boolean  @default(true)
  children            Child[]
  weeklyPlans         WeeklyPlan[]
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

Add `feedingApproach` to Child:

```prisma
model Child {
  id              String   @id @default(cuid())
  name            String
  birthdate       DateTime
  allergies       String   @default("[]")
  feedingApproach String   @default("combination")
  householdId     String
  household       HouseholdProfile @relation(fields: [householdId], references: [id], onDelete: Cascade)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

**Step 2: Generate and apply migration**

Run: `npx prisma migrate dev --name add-seasonal-toggle-and-feeding-approach`
Expected: Migration created and applied successfully.

**Step 3: Verify Prisma client regenerated**

Run: `npx prisma generate`
Expected: Prisma client generated successfully.

**Step 4: Commit**

```bash
git add prisma/
git commit -m "feat: add useSeasonalFoods and feedingApproach to schema"
```

---

### Task 2: Food Stages — Make Labels Approach-Aware

**Files:**
- Modify: `src/lib/food-stages.ts`
- Create: `src/lib/__tests__/food-stages.test.ts`

**Step 1: Write failing tests for approach-aware labels**

Create `src/lib/__tests__/food-stages.test.ts`:

```typescript
import { describe, it, expect, vi, afterEach } from "vitest";
import { getFoodStage, getFoodStageLabel, type FeedingApproach } from "@/lib/food-stages";

describe("getFoodStage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 6-12mo for a 7-month-old", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 15)); // Feb 2026
    const birthdate = new Date(2025, 6, 15); // Jul 2025 = 7 months old
    expect(getFoodStage(birthdate)).toBe("6-12mo");
    vi.useRealTimers();
  });

  it("returns 24mo+ for a 3-year-old", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 15));
    const birthdate = new Date(2023, 1, 15); // 3 years old
    expect(getFoodStage(birthdate)).toBe("24mo+");
    vi.useRealTimers();
  });
});

describe("getFoodStageLabel", () => {
  it("returns traditional label by default", () => {
    expect(getFoodStageLabel("6-12mo")).toBe("Purees & soft solids");
  });

  it("returns traditional label when approach is traditional", () => {
    expect(getFoodStageLabel("6-12mo", "traditional")).toBe("Purees & soft solids");
  });

  it("returns BLW label for 6-12mo", () => {
    expect(getFoodStageLabel("6-12mo", "blw")).toBe("Soft finger foods");
  });

  it("returns combination label for 6-12mo", () => {
    expect(getFoodStageLabel("6-12mo", "combination")).toBe("Purees & finger foods");
  });

  it("returns BLW label for 12-18mo", () => {
    expect(getFoodStageLabel("12-18mo", "blw")).toBe("Self-fed table food");
  });

  it("returns combination label for 12-18mo", () => {
    expect(getFoodStageLabel("12-18mo", "combination")).toBe("Modified & self-fed food");
  });

  it("returns BLW label for 18-24mo", () => {
    expect(getFoodStageLabel("18-24mo", "blw")).toBe("Independent table food");
  });

  it("returns combination label for 18-24mo", () => {
    expect(getFoodStageLabel("18-24mo", "combination")).toBe("Table food (some help)");
  });

  it("returns same label for 24mo+ regardless of approach", () => {
    expect(getFoodStageLabel("24mo+", "traditional")).toBe("Eats with family");
    expect(getFoodStageLabel("24mo+", "blw")).toBe("Eats with family");
    expect(getFoodStageLabel("24mo+", "combination")).toBe("Eats with family");
  });

  it("returns needsApproachSelector true for stages under 24mo", () => {
    expect(needsApproachSelector("6-12mo")).toBe(true);
    expect(needsApproachSelector("12-18mo")).toBe(true);
    expect(needsApproachSelector("18-24mo")).toBe(true);
  });

  it("returns needsApproachSelector false for 24mo+", () => {
    expect(needsApproachSelector("24mo+")).toBe(false);
  });
});
```

Add import for `needsApproachSelector` at the top of the test file.

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/food-stages.test.ts`
Expected: FAIL — `getFoodStageLabel` doesn't accept second param, `needsApproachSelector` doesn't exist.

**Step 3: Implement approach-aware food stages**

Replace `src/lib/food-stages.ts` with:

```typescript
export type FoodStage = "6-12mo" | "12-18mo" | "18-24mo" | "24mo+";
export type FeedingApproach = "traditional" | "blw" | "combination";

export function getFoodStage(birthdate: Date): FoodStage {
  const now = new Date();
  const ageInMonths =
    (now.getFullYear() - birthdate.getFullYear()) * 12 +
    (now.getMonth() - birthdate.getMonth());
  if (ageInMonths < 6) return "6-12mo";
  if (ageInMonths < 12) return "6-12mo";
  if (ageInMonths < 18) return "12-18mo";
  if (ageInMonths < 24) return "18-24mo";
  return "24mo+";
}

const labels: Record<FoodStage, Record<FeedingApproach, string>> = {
  "6-12mo": {
    traditional: "Purees & soft solids",
    blw: "Soft finger foods",
    combination: "Purees & finger foods",
  },
  "12-18mo": {
    traditional: "Modified table food",
    blw: "Self-fed table food",
    combination: "Modified & self-fed food",
  },
  "18-24mo": {
    traditional: "Table food (minor adjustments)",
    blw: "Independent table food",
    combination: "Table food (some help)",
  },
  "24mo+": {
    traditional: "Eats with family",
    blw: "Eats with family",
    combination: "Eats with family",
  },
};

export function getFoodStageLabel(
  stage: FoodStage,
  approach: FeedingApproach = "traditional"
): string {
  return labels[stage][approach];
}

export function needsApproachSelector(stage: FoodStage): boolean {
  return stage !== "24mo+";
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/food-stages.test.ts`
Expected: All tests PASS.

**Step 5: Commit**

```bash
git add src/lib/food-stages.ts src/lib/__tests__/food-stages.test.ts
git commit -m "feat: make food stage labels approach-aware with BLW support"
```

---

### Task 3: Settings Actions — Accept New Fields

**Files:**
- Modify: `src/app/settings/actions.ts:20-42` (updateHousehold)
- Modify: `src/app/settings/actions.ts:44-54` (addChild)
- Modify: `src/app/settings/actions.ts:56-68` (updateChild)

**Step 1: Update `updateHousehold` to accept `useSeasonalFoods`**

In `src/app/settings/actions.ts`, change the `updateHousehold` function signature and body to include `useSeasonalFoods`:

```typescript
export async function updateHousehold(data: {
  dietaryPreferences: string[];
  allergies: string[];
  likedIngredients: string[];
  dislikedIngredients: string[];
  planBreakfast: boolean;
  planLunch: boolean;
  useSeasonalFoods: boolean;
}) {
  const household = await getOrCreateHousehold();

  return db.householdProfile.update({
    where: { id: household.id },
    data: {
      dietaryPreferences: JSON.stringify(data.dietaryPreferences),
      allergies: JSON.stringify(data.allergies),
      likedIngredients: JSON.stringify(data.likedIngredients),
      dislikedIngredients: JSON.stringify(data.dislikedIngredients),
      planBreakfast: data.planBreakfast,
      planLunch: data.planLunch,
      useSeasonalFoods: data.useSeasonalFoods,
    },
    include: { children: true },
  });
}
```

**Step 2: Update `addChild` to accept `feedingApproach`**

```typescript
export async function addChild(data: {
  name: string;
  birthdate: string;
  feedingApproach?: string;
}) {
  const household = await getOrCreateHousehold();

  return db.child.create({
    data: {
      name: data.name,
      birthdate: new Date(data.birthdate),
      feedingApproach: data.feedingApproach ?? "combination",
      householdId: household.id,
    },
  });
}
```

**Step 3: Update `updateChild` to accept `feedingApproach`**

```typescript
export async function updateChild(
  id: string,
  data: {
    name: string;
    birthdate: string;
    allergies: string[];
    feedingApproach?: string;
  }
) {
  return db.child.update({
    where: { id },
    data: {
      name: data.name,
      birthdate: new Date(data.birthdate),
      allergies: JSON.stringify(data.allergies),
      ...(data.feedingApproach !== undefined && {
        feedingApproach: data.feedingApproach,
      }),
    },
  });
}
```

**Step 4: Commit**

```bash
git add src/app/settings/actions.ts
git commit -m "feat: accept useSeasonalFoods and feedingApproach in settings actions"
```

---

### Task 4: Household Form — Add Seasonal Toggle

**Files:**
- Modify: `src/components/settings/household-form.tsx`

**Step 1: Add `useSeasonalFoods` to HouseholdData interface and form state**

Add `useSeasonalFoods: boolean` to the `HouseholdData` interface (line 35-42).

Add state: `const [useSeasonalFoods, setUseSeasonalFoods] = useState(initialData.useSeasonalFoods);`

**Step 2: Add toggle UI in the switches section**

After the "Plan Lunch" toggle block (around line 261-278), add a new toggle:

```tsx
<div className="flex items-center justify-between">
  <div>
    <Label htmlFor="use-seasonal" className="font-semibold text-sm">
      Feature Seasonal Ingredients
    </Label>
    <p className="text-[13px] text-muted-foreground">
      Prioritize what&apos;s fresh and in season.
    </p>
  </div>
  <Switch
    id="use-seasonal"
    checked={useSeasonalFoods}
    onCheckedChange={(checked) => {
      setUseSeasonalFoods(checked);
      setSaved(false);
    }}
  />
</div>
```

**Step 3: Include `useSeasonalFoods` in handleSave**

Update the `handleSave` call to `updateHousehold` to include `useSeasonalFoods`:

```typescript
await updateHousehold({
  dietaryPreferences,
  allergies,
  likedIngredients,
  dislikedIngredients,
  planBreakfast,
  planLunch,
  useSeasonalFoods,
});
```

**Step 4: Update settings page to pass `useSeasonalFoods`**

In `src/app/settings/page.tsx`, add `useSeasonalFoods: household.useSeasonalFoods` to the `HouseholdForm` initialData prop.

**Step 5: Commit**

```bash
git add src/components/settings/household-form.tsx src/app/settings/page.tsx
git commit -m "feat: add seasonal foods toggle to household settings"
```

---

### Task 5: Children Manager — Add Feeding Approach Selector

**Files:**
- Modify: `src/components/settings/children-manager.tsx`

**Step 1: Import `needsApproachSelector` and `FeedingApproach`**

Add to imports:
```typescript
import { getFoodStage, getFoodStageLabel, needsApproachSelector, type FeedingApproach } from "@/lib/food-stages";
```

**Step 2: Add `feedingApproach` to Child interface**

```typescript
interface Child {
  id: string;
  name: string;
  birthdate: Date | string;
  allergies: string;
  feedingApproach: string;
}
```

**Step 3: Add feedingApproach state for add/edit dialogs**

Add state variable:
```typescript
const [newFeedingApproach, setNewFeedingApproach] = useState<FeedingApproach>("combination");
```

Reset it in the add dialog open handler and set it from editingChild in openEditDialog.

**Step 4: Add approach selector UI to both Add and Edit dialogs**

After the birthdate input and food stage preview in each dialog, add (conditionally shown when `needsApproachSelector` returns true for the selected birthdate):

```tsx
{newBirthdate && needsApproachSelector(getFoodStage(new Date(newBirthdate))) && (
  <div className="space-y-2">
    <Label className="text-sm font-semibold">Feeding Approach</Label>
    <div className="grid grid-cols-3 gap-2">
      {(["traditional", "blw", "combination"] as const).map((approach) => (
        <button
          key={approach}
          type="button"
          onClick={() => setNewFeedingApproach(approach)}
          className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
            newFeedingApproach === approach
              ? "border-primary bg-primary/10 text-primary"
              : "border-border hover:bg-muted/50"
          }`}
        >
          {approach === "traditional" ? "Traditional" : approach === "blw" ? "Baby Led Weaning" : "Combination"}
        </button>
      ))}
    </div>
    <p className="text-[11px] text-muted-foreground">
      {newFeedingApproach === "traditional"
        ? "Purees and soft solids first"
        : newFeedingApproach === "blw"
          ? "Finger foods from the start"
          : "Both purees and finger foods"}
    </p>
  </div>
)}
```

**Step 5: Update food stage badge to use approach-aware label**

In both the dialog preview and the child list item, change:
```typescript
getFoodStageLabel(getFoodStage(new Date(newBirthdate)))
```
to:
```typescript
getFoodStageLabel(getFoodStage(new Date(newBirthdate)), newFeedingApproach)
```

For the child list item display:
```typescript
getFoodStageLabel(stage, child.feedingApproach as FeedingApproach)
```

**Step 6: Pass feedingApproach to addChild and updateChild calls**

In `handleAdd`:
```typescript
const child = await addChild({
  name: newName.trim(),
  birthdate: newBirthdate,
  feedingApproach: newFeedingApproach,
});
```

In `handleEdit`:
```typescript
const updated = await updateChild(editingChild.id, {
  name: newName.trim(),
  birthdate: newBirthdate,
  allergies: [],
  feedingApproach: newFeedingApproach,
});
```

**Step 7: Commit**

```bash
git add src/components/settings/children-manager.tsx
git commit -m "feat: add feeding approach selector to children manager"
```

---

### Task 6: AI Prompts — Conditional Seasonal Context and Feeding Approach

**Files:**
- Modify: `src/lib/ai/prompts.ts`

**Step 1: Update `buildChildrenContext` to include feeding approach**

Change `buildChildrenContext` to accept and use `feedingApproach`:

```typescript
function buildChildrenContext(children: Child[]): string {
  if (children.length === 0) return "";

  const lines = children.map((child) => {
    const stage = getFoodStage(child.birthdate);
    const approach = (child as any).feedingApproach ?? "combination";
    const label = getFoodStageLabel(stage, approach as FeedingApproach);
    const childAllergies: string[] = JSON.parse(child.allergies || "[]");
    const allergyNote =
      childAllergies.length > 0
        ? ` Allergies: ${childAllergies.join(", ")}.`
        : "";
    const approachNote = needsApproachSelector(stage)
      ? `, feeding approach: ${approach}`
      : "";
    return `- ${child.name}: food stage "${stage}" (${label})${approachNote}.${allergyNote}`;
  });

  return `\n\nChildren in the household:\n${lines.join("\n")}`;
}
```

Import `FeedingApproach` and `needsApproachSelector` from food-stages.

**Step 2: Update `buildWeeklyPlanPrompt` to accept `useSeasonalFoods` flag**

Change the function signature to accept an optional `useSeasonalFoods` parameter:

```typescript
export function buildWeeklyPlanPrompt(
  season: Season,
  seasonalIngredients: string[],
  household: HouseholdContext,
  children: Child[],
  mealTypes: { breakfast: boolean; lunch: boolean },
  useSeasonalFoods: boolean = true
): { system: string; user: string } {
```

In the system prompt, conditionally include the seasonal instruction:
- When `useSeasonalFoods` is `true`: keep "Each meal should feature at least one seasonal ingredient prominently."
- When `false`: remove that sentence.

In the user prompt, conditionally include season and ingredient info:
- When `true`: keep `Create a 7-day meal plan for the current season: ${season}.\n\nAvailable seasonal ingredients: ${seasonalIngredients.join(", ")}.`
- When `false`: replace with `Create a 7-day meal plan.` (no season or ingredients mentioned).

**Step 3: Update baby adaptation instructions to vary by feeding approach**

In `buildRecipePrompt`, change the children instruction from the hardcoded puree instruction to approach-aware instructions:

```typescript
if (children.length > 0) {
  const childInstructions = children.map((child) => {
    const stage = getFoodStage(child.birthdate);
    if (!needsApproachSelector(stage)) return null;
    const approach = (child as any).feedingApproach ?? "combination";
    switch (approach) {
      case "traditional":
        return `For ${child.name}: provide puree/mash instructions appropriate for their stage.`;
      case "blw":
        return `For ${child.name}: provide finger food suggestions with safe sizes and soft-cooked textures. Do not suggest purees.`;
      case "combination":
        return `For ${child.name}: provide BOTH a puree/mash version AND a finger food version side by side, so the parent can choose.`;
      default:
        return `For ${child.name}: include baby/toddler adaptations for their food stage.`;
    }
  }).filter(Boolean);

  if (childInstructions.length > 0) {
    user += `\n\nBaby/toddler adaptation instructions:\n${childInstructions.join("\n")}`;
  } else {
    user += "\n\nInclude baby/toddler adaptations for each child's food stage, explaining how to modify the dish.";
  }
}
```

**Step 4: Update `buildSwapPrompt` for conditional seasonal context**

Add `useSeasonalFoods` parameter (default `true`). When `false`, omit season and ingredient list from the prompt, similar to `buildWeeklyPlanPrompt`.

```typescript
export function buildSwapPrompt(
  season: Season,
  seasonalIngredients: string[],
  household: HouseholdContext,
  children: Child[],
  existingMealNames: string[],
  useSeasonalFoods: boolean = true
): { system: string; user: string } {
```

When `useSeasonalFoods` is `false`, change system to not mention seasonal ingredients, and user prompt to just say "Suggest 3 alternative dinner options." without season/ingredient context.

**Step 5: Commit**

```bash
git add src/lib/ai/prompts.ts
git commit -m "feat: conditional seasonal context and approach-aware baby adaptations in AI prompts"
```

---

### Task 7: API Route and Actions — Wire Up New Fields

**Files:**
- Modify: `src/app/api/generate-plan/route.ts`
- Modify: `src/app/actions/meal-actions.ts:119-178` (generateAlternatives)

**Step 1: Pass `useSeasonalFoods` in generate-plan route**

In `src/app/api/generate-plan/route.ts`, pass `household.useSeasonalFoods` to `buildWeeklyPlanPrompt`:

```typescript
const { system, user } = buildWeeklyPlanPrompt(
  season,
  ingredientNames,
  {
    dietaryPreferences,
    allergies,
    likedIngredients,
    dislikedIngredients,
  },
  household.children,
  {
    breakfast: household.planBreakfast,
    lunch: household.planLunch,
  },
  household.useSeasonalFoods
);
```

**Step 2: Pass `useSeasonalFoods` in generateAlternatives**

In `src/app/actions/meal-actions.ts`, in `generateAlternatives`, pass the flag:

```typescript
const { system, user } = buildSwapPrompt(
  season,
  ingredientNames,
  { dietaryPreferences, allergies, likedIngredients, dislikedIngredients },
  children,
  existingMealNames,
  household.useSeasonalFoods
);
```

**Step 3: Commit**

```bash
git add src/app/api/generate-plan/route.ts src/app/actions/meal-actions.ts
git commit -m "feat: wire useSeasonalFoods flag through plan and swap generation"
```

---

### Task 8: SeasonIndicator — Conditional Rendering

**Files:**
- Modify: `src/app/page.tsx:58`

**Step 1: Conditionally render SeasonIndicator**

In `src/app/page.tsx`, wrap the `SeasonIndicator` in a conditional:

```tsx
{household.useSeasonalFoods && (
  <SeasonIndicator season={season} ingredients={ingredientNames} />
)}
```

**Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: hide SeasonIndicator when seasonal foods preference is off"
```

---

### Task 9: Run Full Test Suite and Verify

**Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests pass.

**Step 2: Run the dev server and verify manually**

Run: `npm run dev`

Verify:
1. Settings page shows seasonal toggle (on by default)
2. Turning off seasonal toggle and saving works
3. Adding a child under 24mo shows feeding approach selector
4. Adding a child over 24mo does NOT show feeding approach selector
5. Combination is pre-selected as default
6. Generating a plan with seasonal off omits season indicator on home page
7. Generating a recipe for a BLW child shows finger food adaptations

**Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address any issues found during verification"
```
