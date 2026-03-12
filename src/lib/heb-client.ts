const HEB_GRAPHQL_URL = "https://www.heb.com/graphql";

const HASHES = {
  createShoppingList: "e79d5dcdfc241ae8692f04c8776611f1c720a4c79f57ebc35519eb22ace0d5db",
  addToShoppingListV2: "3706ce43a3800c3d3085bf695fc141845d08e20c5dad21fbdd936aebe0b51320",
} as const;

interface HebConfig {
  sessionToken: string;
  storeId: string;
}

async function hebGraphQL(config: HebConfig, operations: unknown[]) {
  const res = await fetch(HEB_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
      origin: "https://www.heb.com",
      referer: "https://www.heb.com/shopping-list",
      cookie: `sst=${config.sessionToken}`,
    },
    body: JSON.stringify(operations),
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error("HEB session expired. Please update your HEB token in settings.");
    }
    throw new Error(`HEB API error: ${res.status}`);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      "HEB session expired or invalid. Please update your HEB token in settings."
    );
  }

  return res.json();
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

  const listId = response?.[0]?.data?.createShoppingListV2?.id;
  if (!listId) {
    throw new Error("Failed to create HEB shopping list");
  }
  return listId;
}

export async function addItemsToHebList(
  config: HebConfig,
  listId: string,
  items: { name: string }[]
): Promise<void> {
  await hebGraphQL(config, [
    {
      operationName: "addToShoppingListV2",
      variables: {
        input: {
          listId,
          listItems: items.map((item) => ({
            item: { genericName: item.name },
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
