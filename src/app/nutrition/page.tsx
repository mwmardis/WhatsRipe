export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { getOrCreateHousehold } from "@/app/settings/actions";
import { getLatestPlan } from "@/app/actions/plan-actions";
import { NutritionView } from "@/components/nutrition/nutrition-view";

export default async function NutritionPage() {
  const household = await getOrCreateHousehold();
  const plan = await getLatestPlan(household.id);

  return (
    <div className="flex flex-col gap-6 px-4 pt-6 pb-28">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          Nutrition
        </h1>
        <p className="text-muted-foreground text-sm">
          Weekly nutritional overview of your meal plan.
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="h-0.5 w-8 rounded-full bg-primary/60" />
          <div className="h-0.5 w-3 rounded-full bg-primary/30" />
          <div className="h-0.5 w-1.5 rounded-full bg-primary/15" />
        </div>
      </div>
      <div className="animate-fade-up">
        <NutritionView weeklyPlanId={plan?.id ?? null} />
      </div>
    </div>
  );
}
