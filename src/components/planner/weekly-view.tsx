"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Timer, X } from "lucide-react";
import { MealCard } from "./meal-card";

interface ChildInfo {
  id: string;
  name: string;
  birthdate: Date;
}

interface MealData {
  id: string;
  mealType: string;
  name: string;
  description: string;
  seasonalIngredients: string[];
  freezerFriendly?: boolean;
  estimatedPrepTime?: number | null;
  estimatedCookTime?: number | null;
  cookingMethod?: string;
  estimatedCost?: number | null;
  rating?: string | null;
}

interface DailyPlanData {
  id: string;
  dayOfWeek: number;
  meals: MealData[];
}

interface BatchCookingSuggestion {
  component: string;
  usedInMeals: string[];
  prepInstructions: string;
  timesSaved: string;
}

export interface WeeklyViewProps {
  weekStart: Date;
  dailyPlans: DailyPlanData[];
  children: ChildInfo[];
  weekLabel?: string;
  batchCookingSuggestions?: BatchCookingSuggestion[];
  mealPrepDay?: string;
  onDeleteMeal?: (mealId: string) => void;
  onSkipDay?: (dailyPlanId: string) => void;
}

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// Desired meal order: breakfast, lunch, dinner
const MEAL_ORDER: Record<string, number> = {
  breakfast: 0,
  lunch: 1,
  dinner: 2,
};

function formatDate(weekStart: Date, dayOffset: number): string {
  const date = new Date(weekStart);
  date.setDate(date.getDate() + dayOffset);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function WeeklyView({
  weekStart,
  dailyPlans,
  children,
  weekLabel,
  batchCookingSuggestions,
  mealPrepDay,
  onDeleteMeal,
  onSkipDay,
}: WeeklyViewProps) {
  const [prepExpanded, setPrepExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-8 animate-fade-up-delay-2">
      {batchCookingSuggestions && batchCookingSuggestions.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <button
            onClick={() => setPrepExpanded(!prepExpanded)}
            className="flex w-full items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-accent" />
              <h3 className="font-display text-base font-semibold">
                {mealPrepDay ? `${mealPrepDay} Prep Plan` : "Batch Cooking Plan"}
              </h3>
              <span className="text-xs text-muted-foreground">
                {batchCookingSuggestions.length} suggestions
              </span>
            </div>
            {prepExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {prepExpanded && (
            <ul className="mt-3 flex flex-col gap-3">
              {batchCookingSuggestions.map((suggestion, i) => (
                <li key={i} className="flex flex-col gap-1 rounded-lg bg-muted/40 p-3">
                  <div className="flex items-baseline justify-between">
                    <span className="font-medium text-sm">{suggestion.component}</span>
                    <span className="text-xs text-muted-foreground">{suggestion.timesSaved}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{suggestion.prepInstructions}</p>
                  <p className="text-xs text-muted-foreground/70">
                    Used in: {suggestion.usedInMeals.join(", ")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {weekLabel && (
        <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
          {weekLabel}
        </h2>
      )}
      {dailyPlans.map((day, dayIndex) => {
        const sortedMeals = [...day.meals].sort(
          (a, b) => (MEAL_ORDER[a.mealType] ?? 3) - (MEAL_ORDER[b.mealType] ?? 3)
        );

        return (
          <div key={day.id} className="flex flex-col gap-3">
            {/* Day header */}
            <div className="group/day flex items-baseline gap-2.5 sticky top-0 bg-background/90 backdrop-blur-sm py-2.5 z-10">
              <h3 className="font-display text-lg font-semibold tracking-tight text-foreground">
                {DAY_NAMES[day.dayOfWeek]}
              </h3>
              <span className="text-sm text-muted-foreground font-medium">
                {formatDate(weekStart, day.dayOfWeek)}
              </span>
              {onSkipDay && day.meals.length > 0 && (
                <button
                  onClick={() => onSkipDay(day.id)}
                  className="ml-auto hidden group-hover/day:flex h-6 items-center gap-1 rounded-full px-2 text-xs text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  aria-label={`Skip ${DAY_NAMES[day.dayOfWeek]}`}
                >
                  <X className="h-3 w-3" />
                  Skip day
                </button>
              )}
            </div>

            {/* Meals */}
            <div className="flex flex-col gap-2.5">
              {sortedMeals.length === 0 ? (
                <div className="flex items-center justify-center rounded-xl border border-dashed border-border/60 py-8 text-sm text-muted-foreground">
                  No meals planned
                </div>
              ) : (
                sortedMeals.map((meal) => (
                  <MealCard
                    key={meal.id}
                    id={meal.id}
                    name={meal.name}
                    description={meal.description}
                    seasonalIngredients={meal.seasonalIngredients}
                    mealType={meal.mealType}
                    children={children}
                    freezerFriendly={meal.freezerFriendly}
                    estimatedPrepTime={meal.estimatedPrepTime}
                    estimatedCookTime={meal.estimatedCookTime}
                    cookingMethod={meal.cookingMethod}
                    estimatedCost={meal.estimatedCost}
                    rating={meal.rating}
                    onDelete={onDeleteMeal}
                  />
                ))
              )}
            </div>

            {/* Subtle divider between days */}
            {dayIndex < dailyPlans.length - 1 && (
              <div className="mt-2 h-px bg-border/50" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-20 text-center animate-fade-up-delay-2">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/60">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="font-display text-xl font-semibold">No meal plan yet</h3>
        <p className="text-sm text-muted-foreground max-w-[240px]">
          Tap the button above to generate your first seasonal meal plan
        </p>
      </div>
    </div>
  );
}
