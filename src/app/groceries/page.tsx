import { getOrCreateHousehold } from "@/app/settings/actions";
import { getLatestPlan } from "@/app/actions/plan-actions";
import { getGroceryList } from "@/app/actions/grocery-actions";
import { GroceryListView } from "@/components/groceries/grocery-list-view";

export default async function GroceriesPage() {
  const household = await getOrCreateHousehold();
  const plan = await getLatestPlan(household.id);

  const groceryList = plan ? await getGroceryList(plan.id) : null;

  return (
    <div className="flex flex-col gap-6 p-4 pb-24">
      <h1 className="text-2xl font-bold">Grocery List</h1>
      <GroceryListView
        weeklyPlanId={plan?.id ?? null}
        groceryList={groceryList}
      />
    </div>
  );
}
