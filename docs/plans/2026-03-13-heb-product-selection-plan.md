# HEB Product Selection & Defaults Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let users search HEB's product catalog, link specific products to grocery items, save defaults that auto-apply via fuzzy matching, and export using product IDs when available.

**Architecture:** New `ProductMapping` table stores generic-name-to-HEB-product defaults. `GroceryItem` gets optional FK to `ProductMapping`. Fuzzy matching auto-links on grocery list generation. Inline search popover + settings management view. Export uses product IDs for mapped items, generic names for unmapped.

**Tech Stack:** Prisma 7, Next.js 16 (App Router, Server Actions, API Routes), React, Tailwind CSS 4, shadcn/ui, Vitest

---

### Task 1: Discovery — Capture HEB Product Search GraphQL Hash

**Files:**
- Create: `docs/plans/heb-search-discovery.md` (notes, can delete after)

**Step 1: Capture the persisted query hash**

Open heb.com in Chrome DevTools → Network tab → filter by "graphql". Search for any product (e.g., "chicken breast"). Find the request that returns product search results. Record:
- The `sha256Hash` from `extensions.persistedQuery`
- The `operationName`
- The full request `variables` shape
- The response shape (what fields come back: productId, name, brand, price, size, imageUrl, etc.)
- Whether `addToShoppingListV2` accepts a `productId` field (check the shopping list add request variables when adding a product from search results)

**Step 2: Document findings**

Save the hash, request shape, and response shape to `docs/plans/heb-search-discovery.md` for reference in Task 3.

**Step 3: Commit**

```bash
git add docs/plans/heb-search-discovery.md
git commit -m "docs: capture HEB product search GraphQL discovery notes"
```

> **BLOCKER:** Tasks 3 and 6 depend on this discovery. The exact field names, hash, and response shape will be used there. Do not proceed to Task 3 until this is complete.

---

### Task 2: Database Schema — ProductMapping Table + GroceryItem FK

**Files:**
- Modify: `prisma/schema.prisma:9-35` (HouseholdProfile — add relation)
- Modify: `prisma/schema.prisma:117-127` (GroceryItem — add FK)
- Add to: `prisma/schema.prisma` (new ProductMapping model)

**Step 1: Add ProductMapping model to schema.prisma**

Add after the `GroceryItem` model (after line 127):

```prisma
model ProductMapping {
  id             String   @id @default(cuid())
  genericName    String
  hebProductId   String
  hebProductName String
  hebBrand       String?
  hebPrice       Float?
  hebSize        String?
  hebImageUrl    String?
  householdId    String
  household      HouseholdProfile @relation(fields: [householdId], references: [id], onDelete: Cascade)
  groceryItems   GroceryItem[]
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([householdId, hebProductId])
}
```

**Step 2: Add FK to GroceryItem**

Add to the `GroceryItem` model (after `manuallyAdded` field):

```prisma
  productMappingId String?
  productMapping   ProductMapping? @relation(fields: [productMappingId], references: [id], onDelete: SetNull)
```

**Step 3: Add relation to HouseholdProfile**

Add to HouseholdProfile model (after `familyMembers` relation):

```prisma
  productMappings   ProductMapping[]
```

**Step 4: Create migration**

Run:
```bash
npx prisma migrate dev --name add_product_mapping
```
Expected: Migration created successfully, Prisma client regenerated.

**Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add ProductMapping table and GroceryItem FK"
```

---

### Task 3: HEB Client — Product Search Function

**Files:**
- Modify: `src/lib/heb-client.ts`
- Test: `src/lib/__tests__/heb-client.test.ts`

> **Depends on Task 1** — use the discovered hash, operationName, variables shape, and response fields.

**Step 1: Write the failing test**

Add to `src/lib/__tests__/heb-client.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseSetCookies } from "../heb-client";

// Note: searchHebProducts makes real HTTP calls via hebGraphQL.
// We test the exported interface shape and error handling by mocking fetch.

describe("searchHebProducts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns parsed product results from HEB GraphQL", async () => {
    // Mock fetch with a realistic HEB response shape
    // Use the actual field names discovered in Task 1
    const mockProducts = [
      {
        productId: "123456",
        name: "H-E-B Natural Boneless Skinless Chicken Breast",
        brand: "H-E-B",
        price: 4.99,
        size: "per lb",
        imageUrl: "https://images.heb.com/is/image/HEBGrocery/123456",
      },
    ];

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: {
        get: () => "application/json",
        getSetCookie: () => [],
      },
      json: async () => [
        {
          data: {
            /* Use actual response shape from discovery */
            searchProducts: { products: mockProducts },
          },
        },
      ],
    } as unknown as Response);

    const { searchHebProducts } = await import("../heb-client");
    const results = await searchHebProducts(
      { sessionToken: "test-sat", storeId: "727" },
      "chicken breast"
    );

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      productId: "123456",
      name: expect.any(String),
    });
  });

  it("throws on expired session", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 401,
      headers: { get: () => null, getSetCookie: () => [] },
    } as unknown as Response);

    const { searchHebProducts } = await import("../heb-client");
    await expect(
      searchHebProducts(
        { sessionToken: "expired", storeId: "727" },
        "milk"
      )
    ).rejects.toThrow("HEB session expired");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/heb-client.test.ts`
Expected: FAIL — `searchHebProducts` is not exported.

**Step 3: Add search hash and interface to heb-client.ts**

Add to `HASHES` object in `src/lib/heb-client.ts`:

```typescript
// Use the actual hash from Task 1 discovery
searchProducts: "DISCOVERED_HASH_HERE",
```

Add the search result interface and export:

```typescript
export interface HebProductResult {
  productId: string;
  name: string;
  brand: string | null;
  price: number | null;
  size: string | null;
  imageUrl: string | null;
}

export async function searchHebProducts(
  config: HebConfig,
  query: string
): Promise<HebProductResult[]> {
  // Use discovered operationName and variables shape
  const response = await hebGraphQL(config, [
    {
      operationName: "DISCOVERED_OPERATION_NAME",
      variables: {
        // Use discovered variables shape — likely includes query, storeId, pagination
        query,
        storeId: config.storeId,
        // ... other fields from discovery
      },
      extensions: {
        persistedQuery: { version: 1, sha256Hash: HASHES.searchProducts },
      },
    },
  ]);

  // Parse using discovered response shape
  const products = response?.[0]?.data?.searchProducts?.products ?? [];

  return products.map((p: Record<string, unknown>) => ({
    productId: String(p.productId ?? ""),
    name: String(p.name ?? ""),
    brand: p.brand ? String(p.brand) : null,
    price: typeof p.price === "number" ? p.price : null,
    size: p.size ? String(p.size) : null,
    imageUrl: p.imageUrl ? String(p.imageUrl) : null,
  }));
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/heb-client.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/heb-client.ts src/lib/__tests__/heb-client.test.ts
git commit -m "feat: add HEB product search function"
```

---

### Task 4: Fuzzy Matching Utility

**Files:**
- Create: `src/lib/fuzzy-match.ts`
- Test: `src/lib/__tests__/fuzzy-match.test.ts`

**Step 1: Write the failing tests**

Create `src/lib/__tests__/fuzzy-match.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { normalizeName, jaccardSimilarity, findBestMatch } from "../fuzzy-match";

describe("normalizeName", () => {
  it("lowercases and trims", () => {
    expect(normalizeName("  Chicken Breast  ")).toBe("chicken breast");
  });

  it("removes common qualifiers", () => {
    expect(normalizeName("fresh organic chicken breast")).toBe("chicken breast");
    expect(normalizeName("large whole milk")).toBe("milk");
    expect(normalizeName("raw dried lentils")).toBe("lentil");
  });

  it("strips trailing s for basic plurals", () => {
    expect(normalizeName("avocados")).toBe("avocado");
    expect(normalizeName("tomatoes")).toBe("tomato");
  });

  it("does not strip s from words ending in ss", () => {
    expect(normalizeName("grass")).toBe("grass");
  });

  it("collapses multiple spaces", () => {
    expect(normalizeName("chicken   breast")).toBe("chicken breast");
  });
});

describe("jaccardSimilarity", () => {
  it("returns 1.0 for identical strings", () => {
    expect(jaccardSimilarity("chicken breast", "chicken breast")).toBe(1.0);
  });

  it("returns 0.0 for completely different strings", () => {
    expect(jaccardSimilarity("chicken", "milk")).toBe(0.0);
  });

  it("returns partial overlap score", () => {
    // "chicken breast" tokens: {chicken, breast}
    // "boneless chicken breast" after normalization: {boneless, chicken, breast}
    // But normalization is applied before calling this — so test raw tokens
    const score = jaccardSimilarity("chicken breast", "chicken thigh");
    // intersection: {chicken}, union: {chicken, breast, thigh} = 1/3
    expect(score).toBeCloseTo(1 / 3, 2);
  });
});

describe("findBestMatch", () => {
  const mappings = [
    { genericName: "chicken breast", id: "1" },
    { genericName: "whole milk", id: "2" },
    { genericName: "cheddar cheese", id: "3" },
  ];

  it("finds exact match", () => {
    const result = findBestMatch("chicken breast", mappings);
    expect(result).toEqual({ id: "1", score: 1.0 });
  });

  it("finds fuzzy match above threshold", () => {
    // "boneless chicken breast" → normalized: "boneless chicken breast"
    // vs "chicken breast" → jaccard: {chicken, breast} / {boneless, chicken, breast} = 2/3 ≈ 0.67
    // With default threshold 0.7, this should NOT match
    const result = findBestMatch("boneless chicken breast", mappings, 0.6);
    expect(result).not.toBeNull();
    expect(result!.id).toBe("1");
  });

  it("returns null when below threshold", () => {
    const result = findBestMatch("mozzarella cheese", mappings);
    // "mozzarella cheese" vs "cheddar cheese" → {cheese} / {mozzarella, cheddar, cheese} = 1/3
    expect(result).toBeNull();
  });

  it("returns null for empty mappings", () => {
    const result = findBestMatch("chicken", []);
    expect(result).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/fuzzy-match.test.ts`
Expected: FAIL — module not found.

**Step 3: Implement fuzzy-match.ts**

Create `src/lib/fuzzy-match.ts`:

```typescript
const QUALIFIERS = new Set([
  "fresh", "organic", "large", "small", "whole", "raw", "dried",
]);

export function normalizeName(name: string): string {
  let result = name.toLowerCase().trim();

  // Remove qualifiers
  result = result
    .split(/\s+/)
    .filter((word) => !QUALIFIERS.has(word))
    .join(" ");

  // Strip trailing "s" for basic plurals (but not "ss" like "grass")
  result = result
    .split(/\s+/)
    .map((word) => (word.length > 2 && word.endsWith("s") && !word.endsWith("ss") ? word.slice(0, -1) : word))
    .join(" ");

  // Also handle "oes" → "o" (tomatoes → tomato)
  // Already handled: "tomatoes" → strip "s" → "tomatoe" — need to also strip trailing "e" after "o"
  // Actually: tomatoes → strip s → "tomatoe" — that's wrong. Let's fix:
  result = result
    .split(/\s+/)
    .map((word) => (word.endsWith("oe") && word.length > 3 ? word.slice(0, -1) : word))
    .join(" ");

  // Collapse multiple spaces
  result = result.replace(/\s+/g, " ").trim();

  return result;
}

function tokenize(s: string): Set<string> {
  return new Set(s.split(/\s+/).filter(Boolean));
}

export function jaccardSimilarity(a: string, b: string): number {
  const setA = tokenize(a);
  const setB = tokenize(b);

  if (setA.size === 0 && setB.size === 0) return 1.0;
  if (setA.size === 0 || setB.size === 0) return 0.0;

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection++;
  }

  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

interface MappingCandidate {
  genericName: string;
  id: string;
}

interface MatchResult {
  id: string;
  score: number;
}

export function findBestMatch(
  itemName: string,
  mappings: MappingCandidate[],
  threshold = 0.7
): MatchResult | null {
  if (mappings.length === 0) return null;

  const normalizedItem = normalizeName(itemName);
  let bestMatch: MatchResult | null = null;

  for (const mapping of mappings) {
    const normalizedMapping = normalizeName(mapping.genericName);
    const score = jaccardSimilarity(normalizedItem, normalizedMapping);

    if (score >= threshold && (bestMatch === null || score > bestMatch.score)) {
      bestMatch = { id: mapping.id, score };
    }
  }

  return bestMatch;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/fuzzy-match.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/fuzzy-match.ts src/lib/__tests__/fuzzy-match.test.ts
git commit -m "feat: add fuzzy matching utility for product mapping"
```

---

### Task 5: Server Actions — Product Mapping CRUD + Auto-Link on Generation

**Files:**
- Create: `src/app/actions/product-mapping-actions.ts`
- Modify: `src/app/actions/grocery-actions.ts`

**Step 1: Create product-mapping-actions.ts**

Create `src/app/actions/product-mapping-actions.ts`:

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getOrCreateHousehold } from "@/app/settings/actions";

export async function createOrUpdateProductMapping(data: {
  genericName: string;
  hebProductId: string;
  hebProductName: string;
  hebBrand?: string | null;
  hebPrice?: number | null;
  hebSize?: string | null;
  hebImageUrl?: string | null;
  groceryItemId?: string;
}) {
  const household = await getOrCreateHousehold();

  const mapping = await db.productMapping.upsert({
    where: {
      householdId_hebProductId: {
        householdId: household.id,
        hebProductId: data.hebProductId,
      },
    },
    update: {
      genericName: data.genericName.toLowerCase().trim(),
      hebProductName: data.hebProductName,
      hebBrand: data.hebBrand ?? null,
      hebPrice: data.hebPrice ?? null,
      hebSize: data.hebSize ?? null,
      hebImageUrl: data.hebImageUrl ?? null,
    },
    create: {
      householdId: household.id,
      genericName: data.genericName.toLowerCase().trim(),
      hebProductId: data.hebProductId,
      hebProductName: data.hebProductName,
      hebBrand: data.hebBrand ?? null,
      hebPrice: data.hebPrice ?? null,
      hebSize: data.hebSize ?? null,
      hebImageUrl: data.hebImageUrl ?? null,
    },
  });

  // Link the grocery item if provided
  if (data.groceryItemId) {
    await db.groceryItem.update({
      where: { id: data.groceryItemId },
      data: { productMappingId: mapping.id },
    });
  }

  revalidatePath("/groceries");
  revalidatePath("/settings");
  return mapping;
}

export async function unlinkProductMapping(groceryItemId: string) {
  await db.groceryItem.update({
    where: { id: groceryItemId },
    data: { productMappingId: null },
  });
  revalidatePath("/groceries");
}

export async function deleteProductMapping(mappingId: string) {
  await db.productMapping.delete({
    where: { id: mappingId },
  });
  revalidatePath("/settings");
  revalidatePath("/groceries");
}

export async function getProductMappings() {
  const household = await getOrCreateHousehold();
  return db.productMapping.findMany({
    where: { householdId: household.id },
    orderBy: { genericName: "asc" },
  });
}
```

**Step 2: Modify generateGroceryList to auto-link**

In `src/app/actions/grocery-actions.ts`, add imports at the top:

```typescript
import { findBestMatch } from "@/lib/fuzzy-match";
```

Replace the grocery list creation block (the `db.groceryList.create` call) with:

```typescript
  // Load existing product mappings for auto-linking
  const productMappings = await db.productMapping.findMany({
    where: { householdId: household.id },
    select: { id: true, genericName: true },
  });

  // Create grocery list and items with auto-linked mappings
  const groceryList = await db.groceryList.create({
    data: {
      weeklyPlanId,
      items: {
        create: object.items.map((item) => {
          const match = findBestMatch(item.name, productMappings);
          return {
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            storeSection: item.storeSection,
            checked: false,
            manuallyAdded: false,
            ...(match ? { productMappingId: match.id } : {}),
          };
        }),
      },
    },
    include: {
      items: {
        orderBy: { storeSection: "asc" },
        include: { productMapping: true },
      },
    },
  });
```

Also update `getGroceryList` to include the product mapping:

```typescript
export async function getGroceryList(weeklyPlanId: string) {
  return db.groceryList.findUnique({
    where: { weeklyPlanId },
    include: {
      items: {
        orderBy: { storeSection: "asc" },
        include: { productMapping: true },
      },
    },
  });
}
```

**Step 3: Commit**

```bash
git add src/app/actions/product-mapping-actions.ts src/app/actions/grocery-actions.ts
git commit -m "feat: add product mapping CRUD and auto-link on grocery generation"
```

---

### Task 6: API Route — HEB Product Search

**Files:**
- Create: `src/app/api/heb-search/route.ts`

> **Depends on Task 1** — uses discovered GraphQL shape.

**Step 1: Create the route**

Create `src/app/api/heb-search/route.ts`:

```typescript
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
```

**Step 2: Commit**

```bash
git add src/app/api/heb-search/route.ts
git commit -m "feat: add HEB product search API route"
```

---

### Task 7: UI — Product Search Popover Component

**Files:**
- Create: `src/components/groceries/product-search-popover.tsx`

**Step 1: Create the component**

Create `src/components/groceries/product-search-popover.tsx`:

```tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, Search, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface HebProduct {
  productId: string;
  name: string;
  brand: string | null;
  price: number | null;
  size: string | null;
  imageUrl: string | null;
}

interface ProductSearchPopoverProps {
  trigger: React.ReactNode;
  onSelect: (product: HebProduct) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ProductSearchPopover({
  trigger,
  onSelect,
  open,
  onOpenChange,
}: ProductSearchPopoverProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<HebProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/heb-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: query.trim() }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Search failed");
          setResults([]);
        } else {
          setResults(data.products ?? []);
        }
      } catch {
        setError("Search failed");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleSelect(product: HebProduct) {
    onSelect(product);
    setQuery("");
    setResults([]);
    onOpenChange?.(false);
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search HEB products..."
            className="border-0 p-0 h-8 focus-visible:ring-0 shadow-none"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults([]);
              }}
              className="shrink-0"
            >
              <X className="size-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="max-h-64 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <p className="px-3 py-4 text-sm text-destructive text-center">
              {error}
            </p>
          )}

          {!loading && !error && results.length === 0 && query.trim() && (
            <p className="px-3 py-4 text-sm text-muted-foreground text-center">
              No products found
            </p>
          )}

          {!loading &&
            results.map((product) => (
              <button
                key={product.productId}
                type="button"
                onClick={() => handleSelect(product)}
                className="flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors border-b border-border/30 last:border-0"
              >
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt=""
                    className="size-10 rounded object-cover shrink-0 bg-muted"
                  />
                ) : (
                  <div className="size-10 rounded bg-muted shrink-0" />
                )}
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-medium leading-tight line-clamp-2">
                    {product.name}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {product.brand && <span>{product.brand}</span>}
                    {product.size && <span>{product.size}</span>}
                  </div>
                  {product.price != null && (
                    <span className="text-xs font-semibold text-primary">
                      ${product.price.toFixed(2)}
                    </span>
                  )}
                </div>
              </button>
            ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/groceries/product-search-popover.tsx
git commit -m "feat: add HEB product search popover component"
```

---

### Task 8: UI — Inline Product Linking in Grocery Section

**Files:**
- Modify: `src/components/groceries/grocery-section.tsx`
- Modify: `src/components/groceries/grocery-list-view.tsx`

**Step 1: Update GroceryItemData interface**

In `src/components/groceries/grocery-section.tsx`, update the `GroceryItemData` interface:

```typescript
interface ProductMappingData {
  id: string;
  hebProductId: string;
  hebProductName: string;
  hebBrand: string | null;
  hebPrice: number | null;
  hebSize: string | null;
  hebImageUrl: string | null;
}

interface GroceryItemData {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  storeSection: string;
  checked: boolean;
  manuallyAdded: boolean;
  productMapping: ProductMappingData | null;
}
```

Update the same interface in `grocery-list-view.tsx` to match.

**Step 2: Add inline product linking to each item row**

In `src/components/groceries/grocery-section.tsx`, import the search popover and server actions:

```typescript
import { Link2, X } from "lucide-react";
import { ProductSearchPopover } from "@/components/groceries/product-search-popover";
import {
  createOrUpdateProductMapping,
  unlinkProductMapping,
} from "@/app/actions/product-mapping-actions";
```

Replace the `<li>` content for each item to include product linking:

```tsx
<li
  key={item.id}
  className={`flex items-start gap-3 px-4 py-3 transition-colors duration-150 ${
    item.checked ? "bg-muted/20" : ""
  }`}
>
  <Checkbox
    checked={item.checked}
    onCheckedChange={() => handleToggle(item.id)}
    className="mt-0.5"
  />
  <div className="flex flex-col gap-1 flex-1 min-w-0">
    <div className="flex items-center gap-2">
      <span
        className={`text-[15px] transition-all duration-200 ${
          item.checked
            ? "line-through text-muted-foreground/60"
            : "text-foreground"
        }`}
      >
        {item.name}
      </span>
      <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">
        {item.quantity} {item.unit}
      </span>
    </div>

    {item.productMapping ? (
      <div className="flex items-center gap-2">
        {item.productMapping.hebImageUrl && (
          <img
            src={item.productMapping.hebImageUrl}
            alt=""
            className="size-6 rounded object-cover shrink-0"
          />
        )}
        <ProductSearchPopover
          trigger={
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <span className="truncate max-w-[200px]">
                {item.productMapping.hebProductName}
              </span>
              {item.productMapping.hebPrice != null && (
                <span className="font-semibold">
                  ${item.productMapping.hebPrice.toFixed(2)}
                </span>
              )}
            </button>
          }
          onSelect={async (product) => {
            await createOrUpdateProductMapping({
              genericName: item.name,
              hebProductId: product.productId,
              hebProductName: product.name,
              hebBrand: product.brand,
              hebPrice: product.price,
              hebSize: product.size,
              hebImageUrl: product.imageUrl,
              groceryItemId: item.id,
            });
          }}
        />
        <button
          type="button"
          onClick={async () => {
            await unlinkProductMapping(item.id);
          }}
          className="shrink-0 p-0.5 rounded hover:bg-muted transition-colors"
        >
          <X className="size-3 text-muted-foreground" />
        </button>
      </div>
    ) : (
      <ProductSearchPopover
        trigger={
          <button
            type="button"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Link2 className="size-3" />
            <span>Link HEB product</span>
          </button>
        }
        onSelect={async (product) => {
          await createOrUpdateProductMapping({
            genericName: item.name,
            hebProductId: product.productId,
            hebProductName: product.name,
            hebBrand: product.brand,
            hebPrice: product.price,
            hebSize: product.size,
            hebImageUrl: product.imageUrl,
            groceryItemId: item.id,
          });
        }}
      />
    )}
  </div>
</li>
```

**Step 3: Commit**

```bash
git add src/components/groceries/grocery-section.tsx src/components/groceries/grocery-list-view.tsx
git commit -m "feat: add inline HEB product linking to grocery items"
```

---

### Task 9: UI — Settings Product Defaults Management

**Files:**
- Modify: `src/components/settings/household-form.tsx` (or create a new component)
- Create: `src/components/settings/product-defaults-section.tsx`

**Step 1: Create the product defaults component**

Create `src/components/settings/product-defaults-section.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowLeftRight, Search } from "lucide-react";
import { ProductSearchPopover } from "@/components/groceries/product-search-popover";
import {
  deleteProductMapping,
  createOrUpdateProductMapping,
} from "@/app/actions/product-mapping-actions";

interface ProductMappingData {
  id: string;
  genericName: string;
  hebProductId: string;
  hebProductName: string;
  hebBrand: string | null;
  hebPrice: number | null;
  hebSize: string | null;
  hebImageUrl: string | null;
}

export function ProductDefaultsSection({
  mappings: initialMappings,
}: {
  mappings: ProductMappingData[];
}) {
  const [filter, setFilter] = useState("");
  const [deleting, startDeleteTransition] = useTransition();

  const filtered = initialMappings.filter(
    (m) =>
      m.genericName.toLowerCase().includes(filter.toLowerCase()) ||
      m.hebProductName.toLowerCase().includes(filter.toLowerCase())
  );

  if (initialMappings.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          HEB Product Defaults
        </h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          No product defaults saved yet. Link products from your grocery list
          and they&apos;ll appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card">
      <div className="p-5 pb-3">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          HEB Product Defaults
        </h2>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Manage your saved product mappings. These auto-apply when grocery lists
          are generated.
        </p>
      </div>

      {initialMappings.length > 5 && (
        <div className="px-5 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter mappings..."
              className="pl-9 rounded-lg"
            />
          </div>
        </div>
      )}

      <div className="divide-y divide-border/40 border-t border-border/40">
        {filtered.map((mapping) => (
          <div
            key={mapping.id}
            className="flex items-center gap-3 px-5 py-3"
          >
            {mapping.hebImageUrl ? (
              <img
                src={mapping.hebImageUrl}
                alt=""
                className="size-10 rounded object-cover shrink-0 bg-muted"
              />
            ) : (
              <div className="size-10 rounded bg-muted shrink-0" />
            )}

            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-muted-foreground">
                  {mapping.genericName}
                </span>
                <span className="text-muted-foreground/50">→</span>
                <span className="font-medium truncate">
                  {mapping.hebProductName}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {mapping.hebBrand && <span>{mapping.hebBrand}</span>}
                {mapping.hebSize && <span>{mapping.hebSize}</span>}
                {mapping.hebPrice != null && (
                  <span className="font-semibold text-primary">
                    ${mapping.hebPrice.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <ProductSearchPopover
                trigger={
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ArrowLeftRight className="size-3.5" />
                  </Button>
                }
                onSelect={async (product) => {
                  await createOrUpdateProductMapping({
                    genericName: mapping.genericName,
                    hebProductId: product.productId,
                    hebProductName: product.name,
                    hebBrand: product.brand,
                    hebPrice: product.price,
                    hebSize: product.size,
                    hebImageUrl: product.imageUrl,
                  });
                }}
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                disabled={deleting}
                onClick={() => {
                  startDeleteTransition(async () => {
                    await deleteProductMapping(mapping.id);
                  });
                }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Wire into settings page**

Find and modify `src/app/settings/page.tsx` to load product mappings and render `ProductDefaultsSection` below the household form, only when HEB credentials are configured.

Add:
```tsx
import { getProductMappings } from "@/app/actions/product-mapping-actions";
import { ProductDefaultsSection } from "@/components/settings/product-defaults-section";

// In the page component, after loading household:
const mappings = household.hebSessionToken ? await getProductMappings() : [];

// In the JSX, after HouseholdForm:
{household.hebSessionToken && household.hebStoreId && (
  <ProductDefaultsSection mappings={mappings} />
)}
```

**Step 3: Commit**

```bash
git add src/components/settings/product-defaults-section.tsx src/app/settings/page.tsx
git commit -m "feat: add HEB product defaults management in settings"
```

---

### Task 10: Export Flow — Use Product IDs for Mapped Items

**Files:**
- Modify: `src/app/api/export-heb/route.ts`
- Modify: `src/lib/heb-client.ts` (update `addItemsToHebList` interface)

> **Depends on Task 1** — need to know how `addToShoppingListV2` accepts product IDs.

**Step 1: Update addItemsToHebList to accept product IDs**

In `src/lib/heb-client.ts`, update the function signature and body:

```typescript
export async function addItemsToHebList(
  config: HebConfig,
  listId: string,
  items: { name: string; hebProductId?: string }[]
): Promise<void> {
  await hebGraphQL(config, [
    {
      operationName: "addToShoppingListV2",
      variables: {
        input: {
          listId,
          listItems: items.map((item) => ({
            item: item.hebProductId
              ? { productId: item.hebProductId }  // Use discovered field name
              : { genericName: item.name },
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

**Step 2: Update export route to include product mapping data**

In `src/app/api/export-heb/route.ts`, update the grocery list query to include product mappings:

```typescript
const groceryList = await db.groceryList.findUnique({
  where: { id: groceryListId },
  include: {
    items: {
      where: { checked: false },
      include: { productMapping: true },
    },
  },
});
```

Update the items mapping:

```typescript
const items = groceryList.items.map((item) => ({
  name: item.name,
  hebProductId: item.productMapping?.hebProductId,
}));
```

**Step 3: Commit**

```bash
git add src/lib/heb-client.ts src/app/api/export-heb/route.ts
git commit -m "feat: use HEB product IDs for mapped items during export"
```

---

### Task 11: End-to-End Smoke Test

**Files:** None (manual testing)

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Test the full flow**

1. Go to Settings → verify HEB credentials are configured
2. Go to grocery list → generate a list
3. Click "Link HEB product" on an item → search → select a product
4. Verify the product shows inline (name, price, image)
5. Click the "x" to unlink → verify it goes back to "Link HEB product"
6. Go to Settings → verify the mapping appears in "HEB Product Defaults"
7. Swap the product from settings → verify it updates
8. Delete a mapping from settings → verify it disappears
9. Regenerate the grocery list → verify auto-linking works for saved mappings
10. Export to HEB → verify mapped items use product IDs

**Step 3: Run tests**

Run: `npx vitest run`
Expected: All tests pass.

**Step 4: Run build**

Run: `npm run build`
Expected: Build succeeds with no errors.

**Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: address issues found during smoke testing"
```

---

Plan complete and saved to `docs/plans/2026-03-13-heb-product-selection-plan.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open a new session with executing-plans, batch execution with checkpoints

Which approach?
