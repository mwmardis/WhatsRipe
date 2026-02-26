"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ArrowLeftRight, Loader2 } from "lucide-react";
import {
  generateAlternatives,
  swapMeal,
} from "@/app/actions/meal-actions";
import type { MealOutput } from "@/lib/ai/schemas";

interface SwapMealsProps {
  mealId: string;
}

export function SwapMeals({ mealId }: SwapMealsProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [alternatives, setAlternatives] = useState<MealOutput[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleOpenSwap() {
    setIsOpen(true);
    setIsLoading(true);
    setError(null);

    try {
      const results = await generateAlternatives(mealId);
      setAlternatives(results);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate alternatives"
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSwap(alternative: MealOutput) {
    setIsSwapping(true);
    try {
      await swapMeal(mealId, {
        name: alternative.name,
        description: alternative.description,
        seasonalIngredients: alternative.seasonalIngredients,
      });
      setIsOpen(false);
      router.push("/");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to swap meal"
      );
    } finally {
      setIsSwapping(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={handleOpenSwap}
        className="w-full"
      >
        <ArrowLeftRight className="h-4 w-4" />
        Swap This Meal
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Swap Meal</SheetTitle>
            <SheetDescription>
              Choose an alternative meal to replace this one.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-3 p-4">
            {isLoading && (
              <div className="flex items-center justify-center gap-2 py-8">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">
                  Finding alternatives...
                </span>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive text-center py-4">
                {error}
              </p>
            )}

            {!isLoading &&
              alternatives.map((alt, i) => (
                <Card
                  key={i}
                  className="cursor-pointer transition-colors hover:bg-accent/50"
                  onClick={() => !isSwapping && handleSwap(alt)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{alt.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    <p className="text-sm text-muted-foreground">
                      {alt.description}
                    </p>
                    {alt.seasonalIngredients.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {alt.seasonalIngredients.map((ing) => (
                          <Badge
                            key={ing}
                            variant="outline"
                            className="text-xs"
                          >
                            {ing}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

            {isSwapping && (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">
                  Swapping meal...
                </span>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
