"use client";

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

interface WeeklyViewProps {
  weekStart: Date;
  dailyPlans: DailyPlanData[];
  children: ChildInfo[];
  weekLabel?: string;
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
}: WeeklyViewProps) {
  return (
    <div className="flex flex-col gap-8 animate-fade-up-delay-2">
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
            <div className="flex items-baseline gap-2.5 sticky top-0 bg-background/90 backdrop-blur-sm py-2.5 z-10">
              <h3 className="font-display text-lg font-semibold tracking-tight text-foreground">
                {DAY_NAMES[day.dayOfWeek]}
              </h3>
              <span className="text-sm text-muted-foreground font-medium">
                {formatDate(weekStart, day.dayOfWeek)}
              </span>
            </div>

            {/* Meals */}
            <div className="flex flex-col gap-2.5">
              {sortedMeals.map((meal) => (
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
                />
              ))}
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
