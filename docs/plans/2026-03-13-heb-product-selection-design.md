# HEB Product Selection & Defaults

**Date:** 2026-03-13
**Status:** Approved

## Problem

Grocery items are exported to HEB as generic text names. HEB's web UI handles product matching, which often picks wrong products. Users have no way to specify which exact HEB product they want for a grocery item, or save those preferences for future weeks.

## Solution

Allow users to search HEB's product catalog and link specific products to grocery items. Save these as defaults that auto-apply to future grocery lists via fuzzy name matching.

## Data Model

### New: ProductMapping

Stores a household's default generic-name-to-HEB-product mappings.

| Field          | Type     | Notes                                    |
|----------------|----------|------------------------------------------|
| id             | String   | cuid                                     |
| genericName    | String   | Normalized: lowercase, trimmed           |
| hebProductId   | String   | HEB's product identifier from GraphQL    |
| hebProductName | String   | Display name                             |
| hebBrand       | String?  | Brand if available                       |
| hebPrice       | Float?   | Unit price                               |
| hebSize        | String?  | Size/weight string                       |
| hebImageUrl    | String?  | Product image URL                        |
| householdId    | String   | FK to HouseholdProfile                   |
| createdAt      | DateTime |                                          |
| updatedAt      | DateTime |                                          |

Unique constraint: `(householdId, hebProductId)`

### Modified: GroceryItem

Add optional FK:
- `productMappingId: String?` — links to ProductMapping

## HEB Product Search API

Reverse-engineer HEB's GraphQL product search using persisted query hashes (same pattern as existing shopping list integration).

- New function: `searchHebProducts(config, query, storeId)` in `heb-client.ts`
- New API route: `POST /api/heb-search` — loads household creds, calls search, returns results
- Results include: productId, name, brand, price, size, imageUrl (based on what API provides)
- Results are ephemeral (not cached) — only saved when user selects a product

**Discovery required:** Capture the product search persisted query hash from heb.com via browser DevTools before implementation.

## Fuzzy Matching

Algorithmic matching to auto-link grocery items to saved defaults.

**Normalization pipeline:**
1. Lowercase
2. Trim whitespace
3. Remove common qualifiers: "fresh", "organic", "large", "small", "whole", "raw", "dried"
4. Strip trailing "s" for basic plural handling
5. Collapse multiple spaces

**Scoring:** Jaccard similarity on word tokens. Threshold: 0.7 (tunable).

**When it runs:** After AI generates a grocery list, before saving to DB. Each item is fuzzy-matched against the household's ProductMapping records. Best match above threshold gets auto-linked.

## UI: Inline Product Linking

Each grocery list item row:
- **Unmapped:** Small "link" icon button next to item name
- **Mapped:** Shows HEB product name, brand, price, thumbnail. "x" to unlink. Click to swap.

**Search popover:**
- Text input with 300ms debounced search → `POST /api/heb-search`
- Results show: product image, name, brand, size, price
- Selecting a result creates/updates ProductMapping and links the GroceryItem
- Closes on selection or click-outside

**Visual treatment:** Mapped items get a subtle green indicator. Unmapped items look the same as today.

## UI: Settings Management View

New "HEB Product Defaults" section in Settings, below HEB credentials. Only visible when credentials are configured.

- Alphabetical list of all ProductMapping records
- Each row: generic name → HEB product (thumbnail, name, brand, size, price)
- Actions per row: "Swap" (opens search popover), "Delete" (removes mapping)
- Search/filter input at top
- Empty state message
- No "add from scratch" — mappings are always created from the grocery list context

## Export Flow Changes

Modified `POST /api/export-heb`:
- **Mapped items:** Use HEB product ID directly (discovery needed: how `addToShoppingListV2` accepts product IDs)
- **Unmapped items:** Continue using `genericName` as today
- **Fallback:** If product ID fails for a specific item, fall back to generic name. Don't fail the entire export.
- Token refresh handling unchanged.
