"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, ChefHat, Loader2 } from "lucide-react";
import { generateRecipe } from "@/app/actions/meal-actions";
import type { Recipe, BabyAdaptation } from "@/app/actions/meal-actions";

interface RecipeViewProps {
  mealId: string;
  initialRecipe: Recipe | null;
  initialAdaptations: BabyAdaptation[] | null;
  onRecipeGenerated?: (recipe: Recipe, adaptations: BabyAdaptation[]) => void;
}

function RecipeSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5 py-2">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground font-medium">
          Crafting your recipe...
        </span>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-7 w-28 rounded-full" />
        <Skeleton className="h-7 w-28 rounded-full" />
      </div>
      <Skeleton className="h-36 w-full rounded-xl" />
      <Skeleton className="h-52 w-full rounded-xl" />
    </div>
  );
}

export function RecipeView({
  mealId,
  initialRecipe,
  initialAdaptations,
  onRecipeGenerated,
}: RecipeViewProps) {
  const [recipe, setRecipe] = useState<Recipe | null>(initialRecipe);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (recipe) return;

    let cancelled = false;

    async function generate() {
      setIsGenerating(true);
      setError(null);
      try {
        const result = await generateRecipe(mealId);
        if (cancelled) return;
        setRecipe(result.recipe);
        onRecipeGenerated?.(result.recipe, result.babyAdaptations);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to generate recipe"
        );
      } finally {
        if (!cancelled) setIsGenerating(false);
      }
    }

    generate();
    return () => {
      cancelled = true;
    };
  }, [mealId, recipe, onRecipeGenerated]);

  if (isGenerating || (!recipe && !error)) {
    return <RecipeSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!recipe) return null;

  return (
    <div className="flex flex-col gap-5">
      {/* Time badges */}
      <div className="flex gap-2">
        <Badge variant="secondary" className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
          <Clock className="h-3 w-3 text-muted-foreground" />
          Prep: {recipe.prepTime}min
        </Badge>
        <Badge variant="secondary" className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
          <ChefHat className="h-3 w-3 text-muted-foreground" />
          Cook: {recipe.cookTime}min
        </Badge>
      </div>

      {/* Ingredients */}
      <div className="rounded-xl border border-border/60 bg-card p-4">
        <h3 className="font-display text-base font-semibold mb-3">Ingredients</h3>
        <ul className="flex flex-col gap-2">
          {recipe.ingredients.map((ing, i) => (
            <li key={i} className="flex items-baseline gap-2 text-sm">
              <span className="font-semibold text-foreground min-w-fit">
                {ing.quantity} {ing.unit}
              </span>
              <span className="text-muted-foreground">{ing.name}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Steps */}
      <div className="rounded-xl border border-border/60 bg-card p-4">
        <h3 className="font-display text-base font-semibold mb-4">Instructions</h3>
        <ol className="flex flex-col gap-4">
          {recipe.steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold">
                {i + 1}
              </span>
              <span className="pt-0.5 leading-relaxed text-foreground/85">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
