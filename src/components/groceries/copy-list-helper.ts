interface GroceryItemData {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  storeSection: string;
  checked: boolean;
  manuallyAdded: boolean;
}

const SECTION_ORDER = ["produce", "dairy", "meat", "pantry", "frozen"];

const SECTION_LABELS: Record<string, string> = {
  produce: "Produce",
  dairy: "Dairy & Eggs",
  meat: "Meat & Seafood",
  pantry: "Pantry",
  frozen: "Frozen",
};

export function formatListForClipboard(items: GroceryItemData[]): string {
  const grouped: Record<string, GroceryItemData[]> = {};
  for (const item of items.filter((i) => !i.checked)) {
    if (!grouped[item.storeSection]) grouped[item.storeSection] = [];
    grouped[item.storeSection].push(item);
  }

  return SECTION_ORDER
    .filter((s) => grouped[s]?.length)
    .map((section) => {
      const label = SECTION_LABELS[section] || section;
      const sectionItems = grouped[section]
        .map((i) => `  [ ] ${i.name} (${i.quantity} ${i.unit})`)
        .join("\n");
      return `${label}:\n${sectionItems}`;
    })
    .join("\n\n");
}
