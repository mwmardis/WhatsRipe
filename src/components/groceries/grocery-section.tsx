"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toggleGroceryItem } from "@/app/actions/grocery-actions";

interface GroceryItemData {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  storeSection: string;
  checked: boolean;
  manuallyAdded: boolean;
}

const SECTION_LABELS: Record<string, string> = {
  produce: "Produce",
  dairy: "Dairy",
  meat: "Meat",
  pantry: "Pantry",
  frozen: "Frozen",
};

export function GrocerySection({
  section,
  items,
}: {
  section: string;
  items: GroceryItemData[];
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [optimisticItems, setOptimisticItems] = useState(items);

  const label = SECTION_LABELS[section] ?? section;
  const count = optimisticItems.length;

  async function handleToggle(id: string) {
    // Optimistic update
    setOptimisticItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
    try {
      await toggleGroceryItem(id);
    } catch {
      // Revert on error
      setOptimisticItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, checked: !item.checked } : item
        )
      );
    }
  }

  return (
    <div className="rounded-lg border bg-card">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {collapsed ? (
            <ChevronRight className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
          <span className="font-medium">{label}</span>
          <span className="text-sm text-muted-foreground">
            ({count} {count === 1 ? "item" : "items"})
          </span>
        </div>
      </button>

      {!collapsed && (
        <ul className="divide-y border-t">
          {optimisticItems.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-2.5">
              <Checkbox
                checked={item.checked}
                onCheckedChange={() => handleToggle(item.id)}
              />
              <span
                className={
                  item.checked
                    ? "line-through text-muted-foreground"
                    : ""
                }
              >
                {item.name}
              </span>
              <span className="ml-auto text-sm text-muted-foreground whitespace-nowrap">
                {item.quantity} {item.unit}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
