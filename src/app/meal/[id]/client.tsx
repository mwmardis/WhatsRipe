"use client";

import { useCallback, useState } from "react";
import { RecipeView } from "@/components/meal/recipe-view";
import { BabyAdaptations } from "@/components/meal/baby-adaptations";
import { SwapMeals } from "@/components/meal/swap-meals";
import { MealRating } from "@/components/meal/meal-rating";
import type { Recipe, BabyAdaptation } from "@/app/actions/meal-actions";

interface ChildInfo {
  id: string;
  name: string;
  birthdate: Date;
}

interface MealDetailClientProps {
  mealId: string;
  mealName: string;
  initialRecipe: Recipe | null;
  initialAdaptations: BabyAdaptation[] | null;
  initialRating: { rating: string; notes: string | null } | null;
  children: ChildInfo[];
}

export function MealDetailClient({
  mealId,
  mealName,
  initialRecipe,
  initialAdaptations,
  initialRating,
  children,
}: MealDetailClientProps) {
  const [adaptations, setAdaptations] = useState<BabyAdaptation[] | null>(
    initialAdaptations
  );

  const handleRecipeGenerated = useCallback(
    (recipe: Recipe, newAdaptations: BabyAdaptation[]) => {
      setAdaptations(newAdaptations);
    },
    []
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Family feedback / rating */}
      <MealRating
        mealId={mealId}
        mealName={mealName}
        initialRating={initialRating}
      />

      {/* Recipe */}
      <RecipeView
        mealId={mealId}
        initialRecipe={initialRecipe}
        initialAdaptations={initialAdaptations}
        onRecipeGenerated={handleRecipeGenerated}
      />

      {/* Baby adaptations */}
      <BabyAdaptations adaptations={adaptations} children={children} />

      {/* Swap meal */}
      <SwapMeals mealId={mealId} />
    </div>
  );
}
