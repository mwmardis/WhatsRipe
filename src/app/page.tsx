import Link from "next/link";
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

  // Check if household is freshly created (no preferences set, no children)
  const dietaryPrefs = JSON.parse(household.dietaryPreferences) as string[];
  const isNewHousehold =
    dietaryPrefs.length === 0 && household.children.length === 0;

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
    <div className="flex flex-col gap-6 px-4 pt-6 pb-28">
      {/* Page header with decorative flourish */}
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          Weekly Planner
        </h1>
        <div className="flex items-center gap-1.5">
          <div className="h-0.5 w-8 rounded-full bg-primary/60" />
          <div className="h-0.5 w-3 rounded-full bg-primary/30" />
          <div className="h-0.5 w-1.5 rounded-full bg-primary/15" />
        </div>
      </div>

      <SeasonIndicator season={season} ingredients={ingredientNames} />

      {isNewHousehold && (
        <div className="animate-fade-up-delay-1 rounded-xl border-2 border-dashed border-accent/50 bg-secondary/50 p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/15">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h2 className="font-display text-xl font-semibold mb-2">Welcome to WhatsRipe!</h2>
          <p className="text-muted-foreground mb-5 text-sm leading-relaxed max-w-[280px] mx-auto">
            Set up your household preferences to get personalized seasonal meal plans.
          </p>
          <Link
            href="/settings"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:bg-primary/90"
          >
            Get Started
          </Link>
        </div>
      )}

      <GenerateButton householdId={household.id} season={season} />

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
