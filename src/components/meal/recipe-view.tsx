"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">
          Generating recipe...
        </span>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-24" />
      </div>
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
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
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!recipe) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* Time badges */}
      <div className="flex gap-2">
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Prep: {recipe.prepTime}min
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1">
          <ChefHat className="h-3 w-3" />
          Cook: {recipe.cookTime}min
        </Badge>
      </div>

      {/* Ingredients */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Ingredients</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-1">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex items-baseline gap-2 text-sm">
                <span className="font-medium">
                  {ing.quantity} {ing.unit}
                </span>
                <span className="text-muted-foreground">{ing.name}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Steps */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-col gap-3">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
