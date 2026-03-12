"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { UtensilsCrossed, Baby, Snowflake, Clock, DollarSign, CookingPot, X } from "lucide-react";
import { getFoodStage } from "@/lib/food-stages";

interface ChildInfo {
  id: string;
  name: string;
  birthdate: Date;
}

interface MealCardProps {
  id: string;
  name: string;
  description: string;
  seasonalIngredients: string[];
  mealType: string;
  children: ChildInfo[];
  freezerFriendly?: boolean;
  estimatedPrepTime?: number | null;
  estimatedCookTime?: number | null;
  cookingMethod?: string;
  estimatedCost?: number | null;
  rating?: string | null;
  onDelete?: (mealId: string) => void;
}

function getAgeInMonths(birthdate: Date): number {
  const now = new Date();
  return (
    (now.getFullYear() - birthdate.getFullYear()) * 12 +
    (now.getMonth() - birthdate.getMonth())
  );
}

function getBabyAdaptationSummary(children: ChildInfo[]): string | null {
  if (children.length === 0) return null;

  const adaptations = children.map((child) => {
    const stage = getFoodStage(child.birthdate);
    const ageMonths = getAgeInMonths(child.birthdate);

    let method: string;
    switch (stage) {
      case "6-12mo":
        method = "puree";
        break;
      case "12-18mo":
        method = "diced";
        break;
      case "18-24mo":
        method = "small pieces";
        break;
      case "24mo+":
        method = "regular";
        break;
    }

    return `${method} for ${child.name} (${ageMonths}mo)`;
  });

  return adaptations.join(", ");
}

const mealTypeLabels: Record<string, string> = {
  dinner: "Dinner",
  breakfast: "Breakfast",
  lunch: "Lunch",
};

const cookingMethodLabels: Record<string, string> = {
  "slow-cooker": "Slow Cooker",
  "instant-pot": "Instant Pot",
};

export function MealCard({
  id,
  name,
  description,
  seasonalIngredients,
  mealType,
  children,
  freezerFriendly,
  estimatedPrepTime,
  estimatedCookTime,
  cookingMethod,
  estimatedCost,
  rating,
  onDelete,
}: MealCardProps) {
  const adaptationSummary = getBabyAdaptationSummary(children);
  const totalTime = (estimatedPrepTime ?? 0) + (estimatedCookTime ?? 0);
  const isQuickMeal = totalTime > 0 && totalTime <= 30;

  // Swipe state
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const dragState = useRef<{ startX: number; dragging: boolean } | null>(null);
  const didSwipe = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!onDelete) return;
    dragState.current = { startX: e.clientX, dragging: false };
    didSwipe.current = false;
  }, [onDelete]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    if (Math.abs(dx) > 5) {
      dragState.current.dragging = true;
      didSwipe.current = true;
      setIsSwiping(true);
    }
    // Only allow swiping left
    if (dx < 0) {
      setOffsetX(dx);
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    if (!dragState.current) return;
    if (offsetX < -80 && onDelete) {
      // Animate off screen then delete
      setOffsetX(-400);
      setTimeout(() => onDelete(id), 200);
    } else {
      setOffsetX(0);
    }
    dragState.current = null;
    // Delay clearing isSwiping so the click handler can check it
    setTimeout(() => setIsSwiping(false), 50);
  }, [offsetX, onDelete, id]);

  const handlePointerCancel = useCallback(() => {
    dragState.current = null;
    setOffsetX(0);
    setIsSwiping(false);
  }, []);

  const handleLinkClick = useCallback((e: React.MouseEvent) => {
    if (didSwipe.current || isSwiping) {
      e.preventDefault();
    }
  }, [isSwiping]);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(id);
  }, [onDelete, id]);

  return (
    <div className="group relative">
      {/* Red delete zone behind card */}
      {onDelete && offsetX < 0 && (
        <div className="absolute inset-0 flex items-center justify-end rounded-xl bg-destructive px-4">
          <span className="text-sm font-medium text-destructive-foreground">Remove</span>
        </div>
      )}

      {/* Desktop X button */}
      {onDelete && (
        <button
          onClick={handleDeleteClick}
          className="absolute right-2 top-2 z-20 hidden h-6 w-6 items-center justify-center rounded-full bg-muted/80 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors group-hover:flex"
          aria-label="Remove meal"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={{
          transform: offsetX !== 0 ? `translateX(${offsetX}px)` : undefined,
          transition: dragState.current?.dragging ? "none" : "transform 0.2s ease-out",
        }}
        className="relative"
      >
        <Link href={`/meal/${id}`} onClick={handleLinkClick}>
          <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-foreground/5 hover:border-border">
            {/* Left accent bar */}
            <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl bg-primary/40 group-hover:bg-primary transition-colors duration-200" />

            <div className="flex flex-col gap-2.5 pl-2">
              {/* Meal type label + rating indicator */}
              <div className="flex items-center gap-1.5">
                <UtensilsCrossed className="h-3.5 w-3.5 text-muted-foreground/70" />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                  {mealTypeLabels[mealType] ?? mealType}
                </span>
                {rating === "loved" && (
                  <span className="text-[11px] text-emerald-600" title="Kids loved it">&#9829;</span>
                )}
                {rating === "refused" && (
                  <span className="text-[11px] text-red-500" title="Kids refused">&#10007;</span>
                )}
              </div>

              {/* Meal name */}
              <h3 className="text-[15px] font-semibold leading-snug text-foreground group-hover:text-primary transition-colors duration-200">
                {name}
              </h3>

              {/* Description */}
              <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
                {description}
              </p>

              {/* Seasonal ingredients */}
              {seasonalIngredients.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {seasonalIngredients.map((ingredient) => (
                    <Badge
                      key={ingredient}
                      variant="secondary"
                      className="rounded-full border-0 px-2 py-0 text-[11px] font-medium bg-secondary text-secondary-foreground"
                    >
                      {ingredient}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Info badges */}
              {(isQuickMeal || freezerFriendly || (cookingMethod && cookingMethod !== "standard") || (estimatedCost != null && estimatedCost > 0)) && (
                <div className="flex flex-wrap gap-1.5">
                  {isQuickMeal && (
                    <Badge variant="outline" className="rounded-full text-[10px] px-1.5 py-0 gap-0.5 border-emerald-300 text-emerald-700">
                      <Clock className="h-2.5 w-2.5" />
                      {totalTime}min
                    </Badge>
                  )}
                  {freezerFriendly && (
                    <Badge variant="outline" className="rounded-full text-[10px] px-1.5 py-0 gap-0.5 border-blue-300 text-blue-700">
                      <Snowflake className="h-2.5 w-2.5" />
                      Freezer
                    </Badge>
                  )}
                  {cookingMethod && cookingMethod !== "standard" && (
                    <Badge variant="outline" className="rounded-full text-[10px] px-1.5 py-0 gap-0.5 border-amber-300 text-amber-700">
                      <CookingPot className="h-2.5 w-2.5" />
                      {cookingMethodLabels[cookingMethod] ?? cookingMethod}
                    </Badge>
                  )}
                  {estimatedCost != null && estimatedCost > 0 && (
                    <Badge variant="outline" className="rounded-full text-[10px] px-1.5 py-0 gap-0.5 border-border text-muted-foreground">
                      <DollarSign className="h-2.5 w-2.5" />
                      ${estimatedCost.toFixed(0)}
                    </Badge>
                  )}
                </div>
              )}

              {/* Baby adaptation hint */}
              {adaptationSummary && (
                <div className="flex items-start gap-1.5 rounded-md bg-[rgba(196,101,42,0.06)] px-2 py-1.5 text-xs">
                  <Baby className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
                  <span className="capitalize text-foreground/70">{adaptationSummary}</span>
                </div>
              )}
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
