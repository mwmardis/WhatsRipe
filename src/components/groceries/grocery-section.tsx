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

const SECTION_CONFIG: Record<string, { label: string; emoji: string }> = {
  produce: { label: "Produce", emoji: "🥬" },
  dairy: { label: "Dairy", emoji: "🧀" },
  meat: { label: "Meat", emoji: "🥩" },
  pantry: { label: "Pantry", emoji: "🫙" },
  frozen: { label: "Frozen", emoji: "🧊" },
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

  const config = SECTION_CONFIG[section] ?? { label: section, emoji: "📦" };
  const count = optimisticItems.length;
  const checkedCount = optimisticItems.filter((i) => i.checked).length;

  async function handleToggle(id: string) {
    setOptimisticItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
    try {
      await toggleGroceryItem(id);
    } catch {
      setOptimisticItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, checked: !item.checked } : item
        )
      );
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between p-3.5 text-left hover:bg-muted/30 transition-colors duration-150"
      >
        <div className="flex items-center gap-2.5">
          {collapsed ? (
            <ChevronRight className="size-4 text-muted-foreground/60" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground/60" />
          )}
          <span className="text-sm">{config.emoji}</span>
          <span className="font-semibold text-[15px]">{config.label}</span>
          <span className="text-xs text-muted-foreground rounded-full bg-muted px-2 py-0.5">
            {checkedCount > 0 ? `${checkedCount}/${count}` : count}
          </span>
        </div>
      </button>

      {!collapsed && (
        <ul className="divide-y divide-border/40 border-t border-border/40">
          {optimisticItems.map((item) => (
            <li
              key={item.id}
              className={`flex items-center gap-3 px-4 py-3 transition-colors duration-150 ${
                item.checked ? "bg-muted/20" : ""
              }`}
            >
              <Checkbox
                checked={item.checked}
                onCheckedChange={() => handleToggle(item.id)}
              />
              <span
                className={`text-[15px] transition-all duration-200 ${
                  item.checked
                    ? "line-through text-muted-foreground/60"
                    : "text-foreground"
                }`}
              >
                {item.name}
              </span>
              <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap font-medium">
                {item.quantity} {item.unit}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
