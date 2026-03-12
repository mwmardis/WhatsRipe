# WhatsRipe Enhancements Design

**Date:** 2026-03-12
**Approach:** Incremental — each feature ships independently in priority order

## 1. Bug Fixes & Model Swap

### 1a. Swap AI Model

Change `gemini-2.5-flash` to `gemini-3.1-flash-lite-preview` in `src/lib/ai/provider.ts`. No other changes needed — the Vercel AI SDK `@ai-sdk/google` provider handles this transparently.

### 1b. Fix Child Age Calculation

**Problem:** `src/lib/food-stages.ts` uses year/month subtraction that doesn't account for day-of-month. A child born Jan 31 shows as 1 month old on Feb 1. `src/lib/ai/prompts.ts` uses a separate millisecond-based approach with an imprecise `30.44` constant.

**Fix:** Unify both files on a consistent millisecond-based calculation:

```ts
const ageInMs = Date.now() - birthdate.getTime();
const ageInDays = ageInMs / (1000 * 60 * 60 * 24);
const ageInMonths = Math.floor(ageInDays / 30.4375);
```

Food stage boundaries (6mo, 12mo, etc.) are broad enough that the 30.4375 average-days-per-month approximation is accurate.

## 2. Feedback Learning

Feed meal rating history back into plan generation prompts.

**Data flow:**
1. `generate-plan/route.ts` queries `MealRating` records (last 30 days or 50 ratings, whichever is smaller)
2. Passes loved/refused lists to `buildWeeklyPlanPrompt`
3. Prompt builder adds a "Family Feedback History" section:
   - Loved meals: "Generate similar styles and flavors"
   - Refused meals: "Avoid these and similar dishes"
   - Ok meals: ignored (neutral signal)

**No schema changes needed** — data already exists in `MealRating` table.

## 3. Meal Prep Intelligence

Add batch cooking suggestions to the AI's weekly plan output.

**Changes:**
- **Prompt:** Add batch cooking analysis instructions to system prompt in `src/lib/ai/prompts.ts`
- **Schema:** Add `batchCookingSuggestions` array to `WeeklyPlan` in `src/lib/ai/schemas.ts`:
  - `component` — what to prep (e.g., "Brown rice")
  - `usedInMeals` — which meals use it (e.g., ["Tuesday dinner", "Thursday dinner"])
  - `prepInstructions` — how to batch prep
  - `timesSaved` — estimated time savings
- **UI:** Collapsible "Prep Day Plan" card at the top of the weekly view

No new API calls — returned as part of the existing `generateObject` call.

## 4. Image Generation

Lazy generation with database caching using Google Imagen.

**Data flow:**
1. User opens meal detail page
2. Check if `Meal.imageUrl` exists
3. If not, call `POST /api/generate-image` with `mealId`
4. Generate image using Imagen, prompt: "Appetizing overhead food photography of [name]: [description]. Natural lighting, rustic table setting, family-style plating. No text or labels."
5. Store as base64 data URL in `Meal.imageUrl`
6. Subsequent views load cached URL instantly

**Changes:**
- Add `imageUrl String?` to `Meal` model in `prisma/schema.prisma`
- New API route `POST /api/generate-image`
- UI: skeleton placeholder while generating, "AI generated" label

**Fallback:** If Imagen isn't available through the Google AI provider, fall back to Gemini's native image generation.

## 5. Grocery Export & HEB Integration

### 5a. Export-Friendly Lists

"Copy to Clipboard" button on grocery list page. Formats list by `storeSection` with checkboxes:

```
Produce:
  [ ] Avocados (2)
  [ ] Bell peppers (3)
Dairy & Eggs:
  [ ] Whole milk (1 gallon)
```

### 5b. HEB GraphQL Integration

**Settings:**
- "HEB Session Token" — user pastes `sst` cookie value from heb.com
- "HEB Store Number" — defaults to preferred store

**Export flow:**
1. User clicks "Export to HEB" on grocery list page
2. `POST /api/export-heb`:
   - Creates HEB shopping list via `createShoppingList` persisted query
   - Adds all items via `addToShoppingListV2` persisted query (generic names)
   - Returns HEB list URL
3. Success toast with link to open HEB list

**HEB GraphQL API details:**
- Endpoint: `POST https://www.heb.com/graphql`
- Auth: cookie-based (`sst` token)
- Format: persisted queries with SHA256 hashes, request body is a JSON array

| Operation | SHA256 Hash | Variables |
|-----------|------------|-----------|
| `createShoppingList` | `e79d5dcdfc241ae8692f04c8776611f1c720a4c79f57ebc35519eb22ace0d5db` | `{ input: { name, storeId } }` |
| `addToShoppingListV2` | `3706ce43a3800c3d3085bf695fc141845d08e20c5dad21fbdd936aebe0b51320` | `{ input: { listId, listItems: [{ item: { genericName } }], page: { sort, sortDirection } } }` |
| `getShoppingListV2` | `38d000bee08ffe637e1b324442d5ec7d2fb4cb6a925a81cd7aab9644f89ca80c` | `{ input: { id, page: { page, size, sort, sortDirection } } }` |
| `getShoppingListsV2` | `35da893a3476a098d44f8d6ac379db3129117b977d4df4dcbe48a5641eb9fdd5` | `{}` |

**Caveats:**
- Session tokens expire — show toast on 401 telling user to update token
- Items added as generic names — HEB shows "Find item" to match specific products
- Unofficial API — no parallel requests, be respectful

## Priority Order

1. Fix age calculation + swap model (quick wins)
2. Feedback learning (prompt change only)
3. Meal prep intelligence (prompt + schema + UI)
4. Image generation (new API + DB migration + UI)
5. HEB grocery export (new API + settings + UI)
6. Export-friendly lists (UI only)
