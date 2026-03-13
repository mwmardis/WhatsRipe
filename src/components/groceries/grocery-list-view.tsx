"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart, Trash2, RefreshCw, ExternalLink, Copy } from "lucide-react";
import { formatListForClipboard } from "@/components/groceries/copy-list-helper";
import { GrocerySection } from "@/components/groceries/grocery-section";
import { AddItemDialog } from "@/components/groceries/add-item-dialog";
import { toast } from "sonner";
import {
  generateGroceryList,
  clearCheckedItems,
} from "@/app/actions/grocery-actions";

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

interface GroceryListData {
  id: string;
  weeklyPlanId: string;
  items: GroceryItemData[];
}

const SECTION_ORDER = ["produce", "dairy", "meat", "pantry", "frozen"];

export function GroceryListView({
  weeklyPlanId,
  groceryList,
}: {
  weeklyPlanId: string | null;
  groceryList: GroceryListData | null;
}) {
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [clearing, startClearTransition] = useTransition();

  // No weekly plan at all
  if (!weeklyPlanId) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border/60 bg-card/50 p-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <ShoppingCart className="size-7 text-muted-foreground/60" />
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-[260px]">
          No meal plan found. Generate a weekly meal plan first, then come back
          to create your grocery list.
        </p>
      </div>
    );
  }

  // Plan exists but no grocery list yet
  if (!groceryList) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 rounded-xl border-2 border-dashed border-accent/30 bg-secondary/30 p-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
          <ShoppingCart className="size-7 text-accent" />
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-[260px]">
          Your meal plan is ready. Generate a grocery list from your planned
          meals.
        </p>
        <Button
          onClick={async () => {
            setGenerating(true);
            try {
              await generateGroceryList(weeklyPlanId);
            } catch {
              toast.error("Failed to generate grocery list");
            } finally {
              setGenerating(false);
            }
          }}
          disabled={generating}
          className="rounded-xl shadow-sm"
        >
          {generating ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <ShoppingCart className="size-4 mr-2" />
              Generate Grocery List
            </>
          )}
        </Button>
      </div>
    );
  }

  // Group items by store section
  const grouped: Record<string, GroceryItemData[]> = {};
  for (const item of groceryList.items) {
    if (!grouped[item.storeSection]) {
      grouped[item.storeSection] = [];
    }
    grouped[item.storeSection].push(item);
  }

  const orderedSections = SECTION_ORDER.filter((s) => grouped[s]?.length);
  const hasCheckedItems = groceryList.items.some((item) => item.checked);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <AddItemDialog groceryListId={groceryList.id} />

        {hasCheckedItems && (
          <Button
            variant="outline"
            size="sm"
            disabled={clearing}
            className="rounded-lg"
            onClick={() => {
              startClearTransition(async () => {
                await clearCheckedItems(groceryList.id);
              });
            }}
          >
            <Trash2 className="size-3.5 mr-1" />
            {clearing ? "Clearing..." : "Clear Checked"}
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            setGenerating(true);
            try {
              await generateGroceryList(weeklyPlanId);
            } catch {
              toast.error("Failed to regenerate grocery list");
            } finally {
              setGenerating(false);
            }
          }}
          disabled={generating}
          className="rounded-lg"
        >
          {generating ? (
            <>
              <Loader2 className="size-3.5 mr-1 animate-spin" />
              Regenerating...
            </>
          ) : (
            <>
              <RefreshCw className="size-3.5 mr-1" />
              Regenerate
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            setExporting(true);
            try {
              const res = await fetch("/api/export-heb", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ groceryListId: groceryList.id }),
              });
              const data = await res.json();
              if (!res.ok) {
                toast.error(data.error || "Export failed");
                return;
              }
              toast.success(`Exported ${data.itemCount} items to HEB`, {
                action: {
                  label: "Open HEB",
                  onClick: () => window.open(data.listUrl, "_blank"),
                },
              });
            } catch {
              toast.error("Failed to export to HEB");
            } finally {
              setExporting(false);
            }
          }}
          disabled={exporting}
          className="rounded-lg"
        >
          {exporting ? (
            <>
              <Loader2 className="size-3.5 mr-1 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <ExternalLink className="size-3.5 mr-1" />
              Export to HEB
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="rounded-lg"
          onClick={async () => {
            const text = formatListForClipboard(groceryList.items);
            await navigator.clipboard.writeText(text);
            toast.success("Grocery list copied to clipboard");
          }}
        >
          <Copy className="size-3.5 mr-1" />
          Copy List
        </Button>
      </div>

      {orderedSections.length === 0 ? (
        <p className="text-center text-muted-foreground py-8 text-sm">
          All items cleared. Add items or regenerate the list.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {orderedSections.map((section, i) => (
            <div
              key={section}
              className="animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <GrocerySection
                section={section}
                items={grouped[section]}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
