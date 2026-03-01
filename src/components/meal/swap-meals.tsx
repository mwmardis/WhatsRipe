"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ArrowLeftRight, Loader2, Snowflake, Clock, DollarSign } from "lucide-react";
import { toast } from "sonner";
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
      const message =
        err instanceof Error ? err.message : "Failed to generate alternatives";
      setError(message);
      toast.error(message);
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
        freezerFriendly: alternative.freezerFriendly,
        estimatedPrepTime: alternative.estimatedPrepTime,
        estimatedCookTime: alternative.estimatedCookTime,
        cookingMethod: alternative.cookingMethod,
        estimatedCost: alternative.estimatedCost,
        leftoverTip: alternative.leftoverTip,
        kidCookingTasks: alternative.kidCookingTasks,
      });
      setIsOpen(false);
      router.push("/");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to swap meal";
      setError(message);
      toast.error(message);
    } finally {
      setIsSwapping(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={handleOpenSwap}
        className="w-full rounded-xl"
      >
        <ArrowLeftRight className="h-4 w-4" />
        Swap This Meal
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="font-display">Swap Meal</SheetTitle>
            <SheetDescription>
              Choose an alternative meal to replace this one.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-3 p-4">
            {isLoading && (
              <div className="flex items-center justify-center gap-2 py-8">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground font-medium">
                  Finding alternatives...
                </span>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-sm text-destructive text-center">{error}</p>
              </div>
            )}

            {!isLoading &&
              alternatives.map((alt, i) => {
                const totalTime = alt.estimatedPrepTime + alt.estimatedCookTime;
                return (
                  <div
                    key={i}
                    className="cursor-pointer rounded-xl border border-border/60 bg-card p-4 transition-all hover:bg-accent/50 hover:-translate-y-0.5 hover:shadow-sm"
                    onClick={() => !isSwapping && handleSwap(alt)}
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <h3 className="font-display font-semibold text-[15px] mb-1.5">
                      {alt.name}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {alt.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {alt.seasonalIngredients.length > 0 &&
                        alt.seasonalIngredients.map((ing) => (
                          <Badge
                            key={ing}
                            variant="secondary"
                            className="text-[11px] rounded-full"
                          >
                            {ing}
                          </Badge>
                        ))}
                      {totalTime > 0 && (
                        <Badge variant="outline" className="rounded-full text-[10px] px-1.5 py-0 gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {totalTime}min
                        </Badge>
                      )}
                      {alt.freezerFriendly && (
                        <Badge variant="outline" className="rounded-full text-[10px] px-1.5 py-0 gap-0.5 border-blue-300 text-blue-700">
                          <Snowflake className="h-2.5 w-2.5" />
                          Freezer
                        </Badge>
                      )}
                      {alt.estimatedCost > 0 && (
                        <Badge variant="outline" className="rounded-full text-[10px] px-1.5 py-0 gap-0.5">
                          <DollarSign className="h-2.5 w-2.5" />
                          ${alt.estimatedCost.toFixed(0)}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}

            {isSwapping && (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground font-medium">
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
