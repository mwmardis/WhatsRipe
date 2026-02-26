# WhatsRipe Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a seasonal meal planning web app with AI-generated weekly plans, baby/toddler food adaptations, and smart grocery lists.

**Architecture:** Next.js App Router with server actions for AI calls. SQLite via Prisma for persistence. Vercel AI SDK for provider-agnostic LLM integration. Static TypeScript data for seasonal ingredients.

**Tech Stack:** Next.js 15, TypeScript, Prisma + SQLite, Vercel AI SDK, Tailwind CSS, shadcn/ui

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Create: `.env.local` (gitignored)
- Create: `.gitignore`

**Step 1: Initialize Next.js project**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Expected: Project files created, no errors.

**Step 2: Install shadcn/ui**

Run:
```bash
npx shadcn@latest init -d
```

Expected: `components.json` created, `src/lib/utils.ts` created.

**Step 3: Install Prisma and Vercel AI SDK**

Run:
```bash
npm install prisma @prisma/client ai @ai-sdk/openai @ai-sdk/anthropic zod
npm install -D prisma
```

**Step 4: Create .env.local**

Create `.env.local` with placeholder keys:
```
OPENAI_API_KEY=sk-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
DATABASE_URL="file:./dev.db"
```

Ensure `.env.local` is in `.gitignore`.

**Step 5: Verify dev server runs**

Run: `npm run dev`
Expected: App runs at http://localhost:3000, shows Next.js default page.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with Tailwind, shadcn, Prisma, AI SDK"
```

---

## Task 2: Database Schema

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/db.ts`

**Step 1: Write Prisma schema**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model HouseholdProfile {
  id                String   @id @default(cuid())
  dietaryPreferences String  @default("[]") // JSON array of strings
  allergies          String  @default("[]") // JSON array of strings
  likedIngredients   String  @default("[]") // JSON array of strings
  dislikedIngredients String @default("[]") // JSON array of strings
  planBreakfast      Boolean @default(false)
  planLunch          Boolean @default(false)
  children           Child[]
  weeklyPlans        WeeklyPlan[]
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}

model Child {
  id          String   @id @default(cuid())
  name        String
  birthdate   DateTime
  allergies   String   @default("[]") // JSON array of strings
  householdId String
  household   HouseholdProfile @relation(fields: [householdId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model WeeklyPlan {
  id          String   @id @default(cuid())
  weekStart   DateTime
  householdId String
  household   HouseholdProfile @relation(fields: [householdId], references: [id], onDelete: Cascade)
  dailyPlans  DailyPlan[]
  groceryList GroceryList?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model DailyPlan {
  id           String   @id @default(cuid())
  dayOfWeek    Int      // 0=Monday, 6=Sunday
  weeklyPlanId String
  weeklyPlan   WeeklyPlan @relation(fields: [weeklyPlanId], references: [id], onDelete: Cascade)
  meals        Meal[]
  createdAt    DateTime @default(now())
}

model Meal {
  id                  String   @id @default(cuid())
  mealType            String   // "dinner", "breakfast", "lunch"
  name                String
  description         String
  seasonalIngredients String   @default("[]") // JSON array of strings
  recipe              String?  // JSON: { ingredients: [], steps: [], prepTime: int, cookTime: int }
  babyAdaptations     String?  // JSON: { "6-12mo": { ... }, "12-18mo": { ... }, ... }
  dailyPlanId         String
  dailyPlan           DailyPlan @relation(fields: [dailyPlanId], references: [id], onDelete: Cascade)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

model GroceryList {
  id           String   @id @default(cuid())
  weeklyPlanId String   @unique
  weeklyPlan   WeeklyPlan @relation(fields: [weeklyPlanId], references: [id], onDelete: Cascade)
  items        GroceryItem[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model GroceryItem {
  id            String   @id @default(cuid())
  name          String
  quantity      Float
  unit          String
  storeSection  String   // "produce", "dairy", "meat", "pantry", "frozen"
  checked       Boolean  @default(false)
  manuallyAdded Boolean  @default(false)
  groceryListId String
  groceryList   GroceryList @relation(fields: [groceryListId], references: [id], onDelete: Cascade)
}
```

**Step 2: Create Prisma client singleton**

Create `src/lib/db.ts`:
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

**Step 3: Generate client and run migration**

Run:
```bash
npx prisma migrate dev --name init
```

Expected: Migration created, SQLite database file created at `prisma/dev.db`.

**Step 4: Verify by running Prisma Studio**

Run: `npx prisma studio`
Expected: Opens browser showing all tables with correct columns.

**Step 5: Commit**

```bash
git add prisma/ src/lib/db.ts
git commit -m "feat: add Prisma schema with all data models"
```

---

## Task 3: Seasonal Ingredients Data

**Files:**
- Create: `src/data/seasonal-ingredients.ts`
- Create: `src/lib/seasons.ts`

**Step 1: Create seasonal ingredients data file**

Create `src/data/seasonal-ingredients.ts` with a comprehensive mapping of US seasonal produce, organized by category (fruits, vegetables, herbs, proteins). Each ingredient lists which seasons it's available in. Include 15-20 items per category minimum. Also define a `pantryStaples` array for always-available items (rice, pasta, olive oil, salt, pepper, flour, sugar, butter, eggs, milk, onions, garlic, canned tomatoes, chicken broth, soy sauce).

Structure:
```typescript
export type Season = "spring" | "summer" | "fall" | "winter";

export interface SeasonalIngredient {
  name: string;
  category: "fruit" | "vegetable" | "herb" | "protein";
  seasons: Season[];
}

export const seasonalIngredients: SeasonalIngredient[] = [
  // Fruits
  { name: "strawberries", category: "fruit", seasons: ["spring", "summer"] },
  { name: "blueberries", category: "fruit", seasons: ["summer"] },
  // ... 60+ ingredients total
];

export const pantryStaples: string[] = [
  "rice", "pasta", "olive oil", /* ... */
];
```

**Step 2: Create season utility**

Create `src/lib/seasons.ts`:
```typescript
import { Season, seasonalIngredients } from "@/data/seasonal-ingredients";

export function getCurrentSeason(): Season {
  const month = new Date().getMonth(); // 0-indexed
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter";
}

export function getSeasonalIngredients(season: Season) {
  return seasonalIngredients.filter((i) => i.seasons.includes(season));
}
```

**Step 3: Write tests for season utility**

Create `src/lib/__tests__/seasons.test.ts`:
- Test `getCurrentSeason()` returns correct season for each month range
- Test `getSeasonalIngredients()` filters correctly

Run: `npm test`

**Step 4: Commit**

```bash
git add src/data/ src/lib/seasons.ts src/lib/__tests__/
git commit -m "feat: add seasonal ingredients data and utility functions"
```

---

## Task 4: Household Profile & Settings Page

**Files:**
- Create: `src/app/settings/page.tsx`
- Create: `src/app/settings/actions.ts` (server actions)
- Create: `src/components/settings/household-form.tsx`
- Create: `src/components/settings/children-manager.tsx`
- Create: `src/components/ui/` (install shadcn components as needed)
- Create: `src/lib/food-stages.ts`

**Step 1: Install needed shadcn components**

Run:
```bash
npx shadcn@latest add button input label card badge select switch dialog form
```

**Step 2: Create food stage utility**

Create `src/lib/food-stages.ts`:
```typescript
export type FoodStage = "6-12mo" | "12-18mo" | "18-24mo" | "24mo+";

export function getFoodStage(birthdate: Date): FoodStage {
  const ageInMonths = /* calculate months between birthdate and now */;
  if (ageInMonths < 6) return "6-12mo"; // treat under-6mo same as 6-12mo for now
  if (ageInMonths < 12) return "6-12mo";
  if (ageInMonths < 18) return "12-18mo";
  if (ageInMonths < 24) return "18-24mo";
  return "24mo+";
}

export function getFoodStageLabel(stage: FoodStage): string {
  const labels: Record<FoodStage, string> = {
    "6-12mo": "Purees & soft solids",
    "12-18mo": "Modified table food",
    "18-24mo": "Table food (minor adjustments)",
    "24mo+": "Eats with family",
  };
  return labels[stage];
}
```

**Step 3: Create server actions for household CRUD**

Create `src/app/settings/actions.ts` with server actions:
- `getOrCreateHousehold()` — returns existing profile or creates one
- `updateHousehold(data)` — updates dietary prefs, allergies, liked/disliked ingredients, meal toggles
- `addChild(data)` — adds a child to the household
- `updateChild(id, data)` — updates child name/birthdate/allergies
- `removeChild(id)` — deletes a child

**Step 4: Build household preferences form**

Create `src/components/settings/household-form.tsx`:
- Multi-select tag input for dietary preferences (predefined options: vegetarian, vegan, gluten-free, dairy-free, nut-free, low-sodium, halal, kosher)
- Multi-select tag input for allergies
- Free-text tag input for liked/disliked ingredients
- Toggle switches for "Plan Breakfast" and "Plan Lunch"
- Save button that calls `updateHousehold` server action

**Step 5: Build children manager component**

Create `src/components/settings/children-manager.tsx`:
- List of current children showing name, age, food stage badge
- "Add Child" button opening a dialog with name + birthdate fields
- Edit/delete buttons per child
- Auto-displays food stage based on birthdate

**Step 6: Build settings page**

Create `src/app/settings/page.tsx`:
- Renders household form and children manager in a clean card layout
- Loads household data via server action on mount

**Step 7: Verify settings page works end-to-end**

Run: `npm run dev`, navigate to `/settings`
- Add dietary preferences, verify they save
- Add a child, verify food stage displays correctly
- Edit and remove a child

**Step 8: Commit**

```bash
git add src/app/settings/ src/components/settings/ src/lib/food-stages.ts
git commit -m "feat: add settings page with household profile and children management"
```

---

## Task 5: App Layout & Navigation

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/components/layout/bottom-nav.tsx`
- Create: `src/app/groceries/page.tsx` (placeholder)

**Step 1: Install icon library**

Run: `npm install lucide-react`

**Step 2: Build bottom navigation bar**

Create `src/components/layout/bottom-nav.tsx`:
- 3 tabs: Plan (CalendarDays icon), Groceries (ShoppingCart icon), Settings (Settings icon)
- Highlights active tab based on current route
- Fixed to bottom of screen on mobile
- Uses Next.js `Link` component + `usePathname()`

**Step 3: Update root layout**

Modify `src/app/layout.tsx`:
- Add bottom nav component
- Add top padding and bottom padding to account for nav bar
- Mobile-first max-width container

**Step 4: Create placeholder pages**

- `src/app/page.tsx` — "Weekly Planner" heading (will build out in Task 6)
- `src/app/groceries/page.tsx` — "Grocery List" heading (will build out in Task 8)

**Step 5: Verify navigation works**

Run: `npm run dev`
- Tap between all 3 tabs, verify routing works
- Verify active state highlights correctly

**Step 6: Commit**

```bash
git add src/app/ src/components/layout/
git commit -m "feat: add bottom navigation bar and app layout shell"
```

---

## Task 6: AI Weekly Plan Generation

**Files:**
- Create: `src/lib/ai/prompts.ts`
- Create: `src/lib/ai/schemas.ts`
- Create: `src/app/api/generate-plan/route.ts`
- Create: `src/app/actions/plan-actions.ts`

**Step 1: Define Zod schemas for AI output**

Create `src/lib/ai/schemas.ts`:
```typescript
import { z } from "zod";

export const mealSchema = z.object({
  name: z.string(),
  description: z.string(),
  seasonalIngredients: z.array(z.string()),
  estimatedPrepTime: z.number(),
  estimatedCookTime: z.number(),
});

export const dailyPlanSchema = z.object({
  dinner: mealSchema,
  breakfast: mealSchema.optional(),
  lunch: mealSchema.optional(),
});

export const weeklyPlanSchema = z.object({
  days: z.array(dailyPlanSchema).length(7),
});
```

**Step 2: Create prompt builder**

Create `src/lib/ai/prompts.ts`:
- `buildWeeklyPlanPrompt(season, ingredients, household, children, mealTypes)` — builds system + user prompt for generating a 7-day plan
- `buildRecipePrompt(mealName, mealDescription, household, children)` — builds prompt for full recipe expansion
- `buildSwapPrompt(season, ingredients, household, children, existingMeals)` — builds prompt for 3 alternatives

Each prompt should:
- Specify the current season and available seasonal ingredients
- Include dietary restrictions and allergies
- List children with food stages
- Request baby adaptations where applicable
- Ask for structured JSON output

**Step 3: Create plan generation API route**

Create `src/app/api/generate-plan/route.ts`:
- POST endpoint
- Reads household profile from DB
- Calls LLM with weekly plan prompt using Vercel AI SDK `generateObject()`
- Returns structured weekly plan JSON

Use `@ai-sdk/openai` by default with a model like `gpt-4o-mini`. The Vercel AI SDK makes swapping providers trivial later.

**Step 4: Create server actions for saving plans**

Create `src/app/actions/plan-actions.ts`:
- `savePlan(weeklyPlanData)` — creates WeeklyPlan + DailyPlan + Meal records in DB
- `getLatestPlan()` — retrieves the most recent weekly plan with all relations
- `deletePlan(id)` — removes a weekly plan

**Step 5: Test plan generation**

Run: `npm run dev`
- Use an API client or temporary button to hit the generate endpoint
- Verify structured JSON comes back with 7 days of meals
- Verify it saves to the database

**Step 6: Commit**

```bash
git add src/lib/ai/ src/app/api/generate-plan/ src/app/actions/
git commit -m "feat: add AI weekly plan generation with structured output"
```

---

## Task 7: Weekly Planner UI

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/components/planner/weekly-view.tsx`
- Create: `src/components/planner/meal-card.tsx`
- Create: `src/components/planner/season-indicator.tsx`
- Create: `src/components/planner/generate-button.tsx`

**Step 1: Install additional shadcn components**

Run: `npx shadcn@latest add skeleton sheet tabs`

**Step 2: Build season indicator component**

Displays current season with an icon and the list of key seasonal ingredients as small badges.

**Step 3: Build meal card component**

Shows:
- Meal name and short description
- Seasonal ingredient tags
- Baby adaptation summary (e.g., "Puree for Emma (8mo), diced for Jack (14mo)")
- Tap to navigate to meal detail (Task 9)

**Step 4: Build weekly view component**

- 7-day scrollable list (Monday–Sunday)
- Each day shows its meal cards (dinner always, breakfast/lunch if enabled)
- Empty state when no plan exists: "Generate your first weekly plan!"

**Step 5: Build generate button**

- "Generate This Week" button
- Shows loading state with skeleton cards while AI generates
- Calls the generate API, saves result, refreshes the view

**Step 6: Wire up the planner page**

Modify `src/app/page.tsx`:
- Load latest plan from DB via server action
- Render season indicator, generate button, weekly view
- Handle empty state

**Step 7: Test full flow**

Run: `npm run dev`
- Click "Generate This Week"
- Verify 7 days of meals appear
- Verify seasonal ingredients show as tags
- Verify baby adaptations appear on meal cards

**Step 8: Commit**

```bash
git add src/app/page.tsx src/components/planner/
git commit -m "feat: add weekly planner UI with meal cards and plan generation"
```

---

## Task 8: Grocery List

**Files:**
- Modify: `src/app/groceries/page.tsx`
- Create: `src/components/groceries/grocery-list-view.tsx`
- Create: `src/components/groceries/grocery-section.tsx`
- Create: `src/components/groceries/add-item-dialog.tsx`
- Create: `src/app/actions/grocery-actions.ts`
- Create: `src/lib/ai/grocery-prompt.ts`

**Step 1: Install shadcn components**

Run: `npx shadcn@latest add checkbox`

**Step 2: Create grocery generation logic**

Create `src/lib/ai/grocery-prompt.ts`:
- Build a prompt that takes all meals from the weekly plan and asks the LLM to:
  - Compile all ingredients
  - Combine duplicates (e.g., "2 onions" + "1 onion" = "3 onions")
  - Categorize each into a store section
  - Return structured JSON

Define Zod schema for grocery output:
```typescript
const groceryItemSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  unit: z.string(),
  storeSection: z.enum(["produce", "dairy", "meat", "pantry", "frozen"]),
});
```

**Step 3: Create grocery server actions**

Create `src/app/actions/grocery-actions.ts`:
- `generateGroceryList(weeklyPlanId)` — calls LLM, saves items to DB
- `getGroceryList(weeklyPlanId)` — fetches list with items
- `toggleGroceryItem(id)` — toggles checked status
- `addGroceryItem(groceryListId, data)` — manually adds item
- `clearCheckedItems(groceryListId)` — removes checked items

**Step 4: Build grocery section component**

Collapsible section with header (e.g., "Produce (8 items)"):
- List of items with checkboxes
- Checked items show strikethrough
- Displays quantity + unit next to name

**Step 5: Build add item dialog**

Dialog with fields: name, quantity, unit, store section dropdown.

**Step 6: Build grocery list view**

- "Generate Grocery List" button (only if a weekly plan exists but no list yet)
- Sections grouped by store section
- "Add Item" floating button
- "Clear Checked" button

**Step 7: Wire up groceries page**

Modify `src/app/groceries/page.tsx`:
- Load grocery list for latest weekly plan
- Render grocery list view or empty state

**Step 8: Test full flow**

- Generate a weekly plan first
- Navigate to Groceries, click "Generate Grocery List"
- Verify items appear grouped by section
- Check/uncheck items, add manual item, clear checked

**Step 9: Commit**

```bash
git add src/app/groceries/ src/components/groceries/ src/app/actions/grocery-actions.ts src/lib/ai/grocery-prompt.ts
git commit -m "feat: add grocery list generation, editing, and management"
```

---

## Task 9: Meal Detail & Recipe View

**Files:**
- Create: `src/app/meal/[id]/page.tsx`
- Create: `src/components/meal/recipe-view.tsx`
- Create: `src/components/meal/baby-adaptations.tsx`
- Create: `src/components/meal/swap-meals.tsx`
- Create: `src/app/actions/meal-actions.ts`

**Step 1: Create meal server actions**

Create `src/app/actions/meal-actions.ts`:
- `getMeal(id)` — fetches meal with daily plan context
- `generateRecipe(mealId)` — calls LLM to expand meal into full recipe, saves to DB
- `generateAlternatives(mealId)` — calls LLM for 3 swap options
- `swapMeal(mealId, newMealData)` — replaces meal in the daily plan

**Step 2: Build recipe view component**

Displays the full adult recipe:
- Ingredients list with quantities
- Numbered step-by-step instructions
- Prep time and cook time badges
- "Generating recipe..." streaming state with skeleton

**Step 3: Build baby adaptations component**

Below the main recipe, one card per child:
- Child's name, age, food stage badge
- Adaptation instructions (e.g., "Blend to smooth puree, omit salt" or "Cut into small pieces, serve without hot sauce")

**Step 4: Build swap meals component**

- "Swap This Meal" button
- Opens a sheet/drawer showing 3 alternative meals
- Each alternative shows name, description, seasonal ingredients
- Tap one to replace the current meal

**Step 5: Build meal detail page**

Create `src/app/meal/[id]/page.tsx`:
- Load meal from DB
- If no recipe yet, auto-trigger recipe generation (streamed)
- Render recipe view + baby adaptations + swap button
- Back button to return to planner

**Step 6: Update meal cards to link here**

Modify `src/components/planner/meal-card.tsx`:
- Wrap card in `Link` to `/meal/[id]`

**Step 7: Test full flow**

- From weekly planner, tap a meal card
- Verify recipe generates and streams in
- Verify baby adaptations display per child
- Test swapping a meal

**Step 8: Commit**

```bash
git add src/app/meal/ src/components/meal/ src/app/actions/meal-actions.ts
git commit -m "feat: add meal detail page with recipe generation, baby adaptations, and meal swapping"
```

---

## Task 10: Polish & Final Integration

**Files:**
- Modify: various existing files
- Create: `src/components/ui/loading.tsx`
- Create: `src/app/not-found.tsx`

**Step 1: Add loading states everywhere**

- Skeleton loaders for weekly plan generation
- Spinner for grocery list generation
- Streaming text for recipe generation
- Loading state for meal swap

**Step 2: Add error handling**

- Toast notifications for failed AI calls (install: `npx shadcn@latest add sonner`)
- Fallback UI for when the database is empty
- Handle network errors gracefully

**Step 3: Mobile responsiveness pass**

- Test all views at 375px width
- Ensure bottom nav doesn't overlap content
- Verify touch targets are at least 44px
- Test grocery list checkboxes on mobile

**Step 4: Auto-create household on first visit**

- If no household profile exists, redirect to settings with a welcome message
- "Welcome to WhatsRipe! Let's set up your household."

**Step 5: Add season-aware theming**

Subtle color accents based on current season:
- Spring: green tones
- Summer: warm yellow/orange
- Fall: amber/brown
- Winter: cool blue

**Step 6: Final end-to-end test**

Complete flow:
1. First visit → redirected to settings
2. Add dietary preferences, add children
3. Navigate to Plan → generate weekly plan
4. Tap a meal → view recipe + baby adaptations
5. Swap a meal
6. Navigate to Groceries → generate list
7. Check off items, add manual item

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add polish — loading states, error handling, mobile responsiveness, season theming"
```
