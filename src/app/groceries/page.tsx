export const maxDuration = 60;

import { getOrCreateHousehold } from "@/app/settings/actions";
import { getLatestPlan } from "@/app/actions/plan-actions";
import { getGroceryList } from "@/app/actions/grocery-actions";
import { GroceryListView } from "@/components/groceries/grocery-list-view";

export default async function GroceriesPage() {
  const household = await getOrCreateHousehold();
  const plan = await getLatestPlan(household.id);

  const groceryList = plan ? await getGroceryList(plan.id) : null;

  return (
    <div className="flex flex-col gap-6 px-4 pt-6 pb-28">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          Grocery List
        </h1>
        <div className="flex items-center gap-1.5">
          <div className="h-0.5 w-8 rounded-full bg-accent/60" />
          <div className="h-0.5 w-3 rounded-full bg-accent/30" />
          <div className="h-0.5 w-1.5 rounded-full bg-accent/15" />
        </div>
      </div>
      <div className="animate-fade-up">
        <GroceryListView
          weeklyPlanId={plan?.id ?? null}
          groceryList={groceryList}
        />
      </div>
    </div>
  );
}
