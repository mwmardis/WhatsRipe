const HEB_GRAPHQL_URL = "https://www.heb.com/graphql";

const HASHES = {
  createShoppingList: "e79d5dcdfc241ae8692f04c8776611f1c720a4c79f57ebc35519eb22ace0d5db",
  addToShoppingListV2: "3706ce43a3800c3d3085bf695fc141845d08e20c5dad21fbdd936aebe0b51320",
} as const;

interface HebConfig {
  sessionToken: string;
  sstToken?: string;
  storeId: string;
}

export interface RefreshedTokens {
  sat?: string;
  sst?: string;
}

export function parseSetCookies(cookies: string[]): RefreshedTokens {
  const result: RefreshedTokens = {};
  for (const cookie of cookies) {
    const [nameValue] = cookie.split(";");
    const eqIdx = nameValue.indexOf("=");
    if (eqIdx === -1) continue;
    const name = nameValue.substring(0, eqIdx);
    const value = nameValue.substring(eqIdx + 1);
    if (name === "sst") result.sst = value;
    if (name === "sat") result.sat = value;
  }
  return result;
}

// Tracks the latest refreshed tokens from the most recent API call.
// The export route reads this after calls complete to persist updates.
let lastRefreshedTokens: RefreshedTokens = {};

export function getLastRefreshedTokens(): RefreshedTokens {
  return lastRefreshedTokens;
}

export function clearRefreshedTokens(): void {
  lastRefreshedTokens = {};
}

async function hebGraphQL(config: HebConfig, operations: unknown[]) {
  const cookieParts = [`sat=${config.sessionToken}`];
  if (config.sstToken) {
    cookieParts.unshift(`sst=${config.sstToken}`);
  }

  const res = await fetch(HEB_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
      origin: "https://www.heb.com",
      referer: "https://www.heb.com/shopping-list",
      cookie: cookieParts.join("; "),
    },
    body: JSON.stringify(operations),
  });

  // Parse refreshed tokens from response
  const setCookies = res.headers.getSetCookie
    ? res.headers.getSetCookie()
    : [];
  const refreshed = parseSetCookies(setCookies);
  if (refreshed.sat || refreshed.sst) {
    lastRefreshedTokens = { ...lastRefreshedTokens, ...refreshed };
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error("HEB session expired. Please update your HEB tokens in settings.");
    }
    throw new Error(`HEB API error: ${res.status}`);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      "HEB session expired or invalid. Please update your HEB tokens in settings."
    );
  }

  return res.json();
}

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
  const cookieParts = [`sat=${config.sessionToken}`];
  if (config.sstToken) {
    cookieParts.unshift(`sst=${config.sstToken}`);
  }

  const url = `https://www.heb.com/search?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
      accept: "text/html",
      cookie: cookieParts.join("; "),
    },
  });

  // Parse refreshed tokens from response
  const setCookies = res.headers.getSetCookie
    ? res.headers.getSetCookie()
    : [];
  const refreshed = parseSetCookies(setCookies);
  if (refreshed.sat || refreshed.sst) {
    lastRefreshedTokens = { ...lastRefreshedTokens, ...refreshed };
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        "HEB session expired. Please update your HEB tokens in settings."
      );
    }
    throw new Error(`HEB search failed: ${res.status}`);
  }

  const html = await res.text();

  // Extract __NEXT_DATA__ JSON from the HTML
  const match = html.match(
    /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/
  );
  if (!match) return [];

  let nextData: Record<string, unknown>;
  try {
    nextData = JSON.parse(match[1]);
  } catch {
    return [];
  }

  // Navigate to searchGridV2 items
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props = nextData as any;
  const components =
    props?.props?.pageProps?.layout?.visualComponents ?? [];
  const searchGrid = components.find(
    (c: { type: string }) => c.type === "searchGridV2"
  );
  if (!searchGrid) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (searchGrid.items ?? []).filter(
    (item: { __typename: string }) => item.__typename === "Product"
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return items.map((item: any): HebProductResult => {
    const sku = item.SKUs?.[0];
    const price = sku?.contextPrices?.[0]?.listPrice?.amount ?? null;
    const size = sku?.customerFriendlySize ?? null;
    const mediumImg = item.productImageUrls?.find(
      (img: { size: string }) => img.size === "MEDIUM"
    );
    const imageUrl =
      mediumImg?.url ?? item.productImageUrls?.[0]?.url ?? null;

    return {
      productId: String(item.id),
      name: String(item.displayName ?? ""),
      brand: item.brand?.name ?? null,
      price: typeof price === "number" ? price : null,
      size: size ? String(size) : null,
      imageUrl: imageUrl ? String(imageUrl) : null,
    };
  });
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

  const gqlErrors = response?.[0]?.errors;
  if (gqlErrors?.some((e: { extensions?: { code?: string } }) => e.extensions?.code === "UNAUTHENTICATED")) {
    throw new Error("HEB session expired. Please update your HEB tokens in settings.");
  }
  const result = response?.[0]?.data?.createShoppingListV2;
  if (result?.code === "LIST_UNIQUE_NAME") {
    return createHebShoppingList(config, `${name} (${Date.now()})`);
  }
  if (!result?.id) {
    throw new Error("Failed to create HEB shopping list");
  }
  return result.id;
}

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
              ? { productId: item.hebProductId }
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
