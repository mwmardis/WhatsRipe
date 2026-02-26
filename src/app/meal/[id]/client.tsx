"use client";

import { useCallback, useState } from "react";
import { RecipeView } from "@/components/meal/recipe-view";
import { BabyAdaptations } from "@/components/meal/baby-adaptations";
import { SwapMeals } from "@/components/meal/swap-meals";
import type { Recipe, BabyAdaptation } from "@/app/actions/meal-actions";

interface ChildInfo {
  id: string;
  name: string;
  birthdate: Date;
}

interface MealDetailClientProps {
  mealId: string;
  initialRecipe: Recipe | null;
  initialAdaptations: BabyAdaptation[] | null;
  children: ChildInfo[];
}

export function MealDetailClient({
  mealId,
  initialRecipe,
  initialAdaptations,
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
