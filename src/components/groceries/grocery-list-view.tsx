"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart, Trash2 } from "lucide-react";
import { GrocerySection } from "@/components/groceries/grocery-section";
import { AddItemDialog } from "@/components/groceries/add-item-dialog";
import { toast } from "sonner";
import {
  generateGroceryList,
  clearCheckedItems,
} from "@/app/actions/grocery-actions";

interface GroceryItemData {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  storeSection: string;
  checked: boolean;
  manuallyAdded: boolean;
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
  const [clearing, startClearTransition] = useTransition();

  // No weekly plan at all
  if (!weeklyPlanId) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 text-center">
        <ShoppingCart className="size-10 text-muted-foreground" />
        <p className="text-muted-foreground">
          No meal plan found. Generate a weekly meal plan first, then come back
          to create your grocery list.
        </p>
      </div>
    );
  }

  // Plan exists but no grocery list yet
  if (!groceryList) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
        <ShoppingCart className="size-10 text-muted-foreground" />
        <p className="text-muted-foreground">
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
            onClick={() => {
              startClearTransition(async () => {
                await clearCheckedItems(groceryList.id);
              });
            }}
          >
            <Trash2 className="size-4 mr-1" />
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
          className="ml-auto"
        >
          {generating ? (
            <>
              <Loader2 className="size-4 mr-1 animate-spin" />
              Regenerating...
            </>
          ) : (
            "Regenerate"
          )}
        </Button>
      </div>

      {orderedSections.length === 0 ? (
        <p className="text-center text-muted-foreground py-6">
          All items cleared. Add items or regenerate the list.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {orderedSections.map((section) => (
            <GrocerySection
              key={section}
              section={section}
              items={grouped[section]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
