# WhatsRipe

Family meal planning app with AI-powered seasonal meal generation, baby/toddler food stage adaptations, and grocery list management.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Server Components, Server Actions)
- **Language:** TypeScript
- **AI:** Vercel AI SDK v6 + `@ai-sdk/google` (Google Gemini 3.1 Flash Lite Preview)
- **Database:** PostgreSQL via Prisma 7 (driver adapter pattern)
- **Styling:** Tailwind CSS 4 + shadcn/ui components
- **Testing:** Vitest with path aliases (`@/` mapped to `src/`)
- **Deployment:** Vercel

## Project Structure

```
src/
  app/                    # Next.js App Router pages and API routes
    actions/              # Server actions (plan-actions, meal-actions, grocery-actions)
    api/                  # API routes (generate-plan, generate-image, export-heb)
    meal/[id]/            # Meal detail page with recipe generation
    settings/             # Household settings page and actions
  components/             # React components
    planner/              # Weekly view, meal cards, generate button
    meal/                 # Meal detail components, meal image
    groceries/            # Grocery list view, sections, add dialog
    settings/             # Household form, children manager
  lib/                    # Shared utilities
    ai/                   # AI provider, prompts, schemas
    __tests__/            # Vitest test files
  data/                   # Static data (seasonal ingredients)
prisma/
  schema.prisma           # Database schema
  migrations/             # Prisma migrations
```

## Key Architecture Patterns

- **AI Provider:** Single `getModel()` in `src/lib/ai/provider.ts` — swap model for entire app here
- **Structured Output:** Zod schemas in `src/lib/ai/schemas.ts` define AI output shape, used with `generateObject()`
- **Prompt Building:** `src/lib/ai/prompts.ts` builds system+user prompts from household context
- **JSON-in-String Fields:** Prisma stores arrays as JSON strings (e.g., `dietaryPreferences`, `seasonalIngredients`). Parse with `JSON.parse()` on read, `JSON.stringify()` on write
- **Server Actions:** Used for mutations (save plan, rate meal, toggle grocery item). API routes for AI generation endpoints
- **Food Stages:** Child age determines food stage (6-12mo, 12-18mo, 18-24mo, 24mo+) — day-based calculation in `src/lib/food-stages.ts`

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm test             # Run Vitest tests (or: npx vitest run)
npx prisma generate  # Regenerate Prisma client after schema changes
npx prisma migrate dev --name <name>  # Create migration
```

## Database

- Single household (no auth yet) — `getOrCreateHousehold()` in `src/app/settings/actions.ts`
- Key models: HouseholdProfile, Child, WeeklyPlan, DailyPlan, Meal, MealRating, GroceryList, GroceryItem
- `WeeklyPlan.batchCookingSuggestions` — JSON string of batch cooking tips
- `Meal.imageUrl` — cached base64 data URL from AI image generation
- `HouseholdProfile.hebSessionToken` / `hebStoreId` — HEB grocery integration credentials

## Worktrees

Use `.worktrees/` directory for git worktrees (already in .gitignore).
