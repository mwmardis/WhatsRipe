export const maxDuration = 60;

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Snowflake, Clock, ChefHat, DollarSign, CookingPot, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMeal } from "@/app/actions/meal-actions";
import { getOrCreateHousehold } from "@/app/settings/actions";
import { MealDetailClient } from "./client";

interface MealPageProps {
  params: Promise<{ id: string }>;
}

export default async function MealPage({ params }: MealPageProps) {
  const { id } = await params;
  const meal = await getMeal(id);

  if (!meal) {
    notFound();
  }

  const household = await getOrCreateHousehold();
  const children = household.children.map((child) => ({
    id: child.id,
    name: child.name,
    birthdate: new Date(child.birthdate),
  }));

  const seasonalIngredients: string[] = JSON.parse(meal.seasonalIngredients);
  const kidCookingTasks: { task: string; minAge: number }[] = meal.kidCookingTasks
    ? JSON.parse(meal.kidCookingTasks)
    : [];

  // Parse recipe and adaptations if they exist
  const recipe = meal.recipe ? JSON.parse(meal.recipe) : null;
  const babyAdaptations = meal.babyAdaptations
    ? JSON.parse(meal.babyAdaptations)
    : null;

  const currentRating = meal.ratings?.[0] ?? null;

  const mealTypeLabels: Record<string, string> = {
    dinner: "Dinner",
    breakfast: "Breakfast",
    lunch: "Lunch",
  };

  const cookingMethodLabels: Record<string, string> = {
    "standard": "Standard",
    "slow-cooker": "Slow Cooker",
    "instant-pot": "Instant Pot",
  };

  return (
    <div className="flex flex-col gap-6 px-4 pt-4 pb-28">
      {/* Back button */}
      <Button variant="ghost" size="sm" className="w-fit -ml-2 text-muted-foreground hover:text-foreground" asChild>
        <Link href="/">
          <ArrowLeft className="h-4 w-4" />
          Back to Planner
        </Link>
      </Button>

      {/* Meal header */}
      <div className="flex flex-col gap-3 animate-fade-up">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
          {mealTypeLabels[meal.mealType] ?? meal.mealType}
        </span>
        <h1 className="font-display text-2xl font-bold tracking-tight leading-tight">{meal.name}</h1>
        <p className="text-muted-foreground leading-relaxed">{meal.description}</p>

        {/* Info badges */}
        <div className="flex flex-wrap gap-2 pt-1">
          {meal.estimatedPrepTime != null && (
            <Badge variant="secondary" className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
              <Clock className="h-3 w-3 text-muted-foreground" />
              Prep: {meal.estimatedPrepTime}min
            </Badge>
          )}
          {meal.estimatedCookTime != null && (
            <Badge variant="secondary" className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
              <ChefHat className="h-3 w-3 text-muted-foreground" />
              Cook: {meal.estimatedCookTime}min
            </Badge>
          )}
          {meal.freezerFriendly && (
            <Badge variant="outline" className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border-blue-300 text-blue-700">
              <Snowflake className="h-3 w-3" />
              Freezer Friendly
            </Badge>
          )}
          {meal.cookingMethod !== "standard" && (
            <Badge variant="outline" className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border-amber-300 text-amber-700">
              <CookingPot className="h-3 w-3" />
              {cookingMethodLabels[meal.cookingMethod] ?? meal.cookingMethod}
            </Badge>
          )}
          {meal.estimatedCost != null && meal.estimatedCost > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
              <DollarSign className="h-3 w-3 text-muted-foreground" />
              ~${meal.estimatedCost.toFixed(0)}
            </Badge>
          )}
        </div>

        {seasonalIngredients.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {seasonalIngredients.map((ingredient) => (
              <Badge
                key={ingredient}
                variant="secondary"
                className="rounded-full border-0 px-2.5 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground"
              >
                {ingredient}
              </Badge>
            ))}
          </div>
        )}

        {/* Leftover tip */}
        {meal.leftoverTip && (
          <div className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-muted/30 p-3 mt-1">
            <Lightbulb className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <span className="text-xs font-semibold text-foreground">Leftover Tip</span>
              <p className="text-sm text-muted-foreground mt-0.5">{meal.leftoverTip}</p>
            </div>
          </div>
        )}

        {/* Kid cooking tasks */}
        {kidCookingTasks.length > 0 && (
          <div className="rounded-xl border border-border/60 bg-card p-4 mt-1">
            <h3 className="font-display text-base font-semibold mb-3">Kids Can Help</h3>
            <ul className="flex flex-col gap-2">
              {kidCookingTasks.map((task, i) => (
                <li key={i} className="flex items-baseline gap-2 text-sm">
                  <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px] shrink-0">
                    {task.minAge}y+
                  </Badge>
                  <span className="text-foreground/85">{task.task}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Decorative divider */}
        <div className="flex items-center gap-2 pt-1">
          <div className="h-px flex-1 bg-border/50" />
          <div className="h-1.5 w-1.5 rounded-full bg-primary/30" />
          <div className="h-px flex-1 bg-border/50" />
        </div>
      </div>

      {/* Client-side interactive components */}
      <div className="animate-fade-up-delay-1">
        <MealDetailClient
          mealId={meal.id}
          mealName={meal.name}
          initialRecipe={recipe}
          initialAdaptations={babyAdaptations}
          initialRating={currentRating ? { rating: currentRating.rating, notes: currentRating.notes } : null}
          children={children}
        />
      </div>
    </div>
  );
}
