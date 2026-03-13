"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Link2, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toggleGroceryItem } from "@/app/actions/grocery-actions";
import { ProductSearchPopover } from "@/components/groceries/product-search-popover";
import {
  createOrUpdateProductMapping,
  unlinkProductMapping,
} from "@/app/actions/product-mapping-actions";

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
              className={`flex items-start gap-3 px-4 py-3 transition-colors duration-150 ${
                item.checked ? "bg-muted/20" : ""
              }`}
            >
              <Checkbox
                checked={item.checked}
                onCheckedChange={() => handleToggle(item.id)}
                className="mt-0.5"
              />
              <div className="flex flex-col gap-1 min-w-0 flex-1">
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
                  <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap font-medium">
                    {item.quantity} {item.unit}
                  </span>
                </div>
                {item.productMapping ? (
                  <div className="flex items-center gap-2">
                    {item.productMapping.hebImageUrl && (
                      <img src={item.productMapping.hebImageUrl} alt="" className="size-6 rounded object-cover shrink-0" />
                    )}
                    <ProductSearchPopover
                      trigger={
                        <button type="button" className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 transition-colors">
                          <span className="truncate max-w-[200px]">{item.productMapping.hebProductName}</span>
                          {item.productMapping.hebPrice != null && (
                            <span className="font-semibold">${item.productMapping.hebPrice.toFixed(2)}</span>
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
                      onClick={async () => { await unlinkProductMapping(item.id); }}
                      className="shrink-0 p-0.5 rounded hover:bg-muted transition-colors"
                    >
                      <X className="size-3 text-muted-foreground" />
                    </button>
                  </div>
                ) : (
                  <ProductSearchPopover
                    trigger={
                      <button type="button" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
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
          ))}
        </ul>
      )}
    </div>
  );
}
