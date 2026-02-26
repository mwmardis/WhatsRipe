import { getOrCreateHousehold } from "@/app/settings/actions";
import { getLatestPlan } from "@/app/actions/plan-actions";
import { getCurrentSeason, getSeasonalIngredients } from "@/lib/seasons";
import { SeasonIndicator } from "@/components/planner/season-indicator";
import { GenerateButton } from "@/components/planner/generate-button";
import { WeeklyView, EmptyState } from "@/components/planner/weekly-view";

export default async function Home() {
  const household = await getOrCreateHousehold();
  const plan = await getLatestPlan(household.id);

  const season = getCurrentSeason();
  const seasonalIngredientsList = getSeasonalIngredients(season);
  const ingredientNames = seasonalIngredientsList
    .slice(0, 8)
    .map((i) => i.name);

  // Serialize children with birthdate as Date for client components
  const children = household.children.map((child) => ({
    id: child.id,
    name: child.name,
    birthdate: new Date(child.birthdate),
  }));

  // Parse the plan's meal data — JSON string fields need parsing
  const parsedDailyPlans = plan?.dailyPlans.map((dp) => ({
    id: dp.id,
    dayOfWeek: dp.dayOfWeek,
    meals: dp.meals.map((meal) => ({
      id: meal.id,
      mealType: meal.mealType,
      name: meal.name,
      description: meal.description,
      seasonalIngredients: JSON.parse(meal.seasonalIngredients) as string[],
    })),
  }));

  return (
    <div className="flex flex-col gap-6 p-4 pb-24">
      <h1 className="text-2xl font-bold">Weekly Planner</h1>

      <SeasonIndicator season={season} ingredients={ingredientNames} />

      <GenerateButton householdId={household.id} />

      {plan && parsedDailyPlans ? (
        <WeeklyView
          weekStart={new Date(plan.weekStart)}
          dailyPlans={parsedDailyPlans}
          children={children}
        />
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
