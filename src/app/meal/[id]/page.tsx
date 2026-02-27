import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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

  // Parse recipe and adaptations if they exist
  const recipe = meal.recipe ? JSON.parse(meal.recipe) : null;
  const babyAdaptations = meal.babyAdaptations
    ? JSON.parse(meal.babyAdaptations)
    : null;

  const mealTypeLabels: Record<string, string> = {
    dinner: "Dinner",
    breakfast: "Breakfast",
    lunch: "Lunch",
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
          initialRecipe={recipe}
          initialAdaptations={babyAdaptations}
          children={children}
        />
      </div>
    </div>
  );
}
