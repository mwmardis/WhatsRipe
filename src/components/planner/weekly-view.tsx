"use client";

import { MealCard } from "./meal-card";
import { CalendarDays } from "lucide-react";

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
}: WeeklyViewProps) {
  return (
    <div className="flex flex-col gap-6">
      {dailyPlans.map((day) => {
        const sortedMeals = [...day.meals].sort(
          (a, b) => (MEAL_ORDER[a.mealType] ?? 3) - (MEAL_ORDER[b.mealType] ?? 3)
        );

        return (
          <div key={day.id} className="flex flex-col gap-2">
            <div className="flex items-center gap-2 sticky top-0 bg-background py-2 z-10">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">
                {DAY_NAMES[day.dayOfWeek]}
              </h3>
              <span className="text-sm text-muted-foreground">
                {formatDate(weekStart, day.dayOfWeek)}
              </span>
            </div>
            <div className="flex flex-col gap-2 pl-1">
              {sortedMeals.map((meal) => (
                <MealCard
                  key={meal.id}
                  id={meal.id}
                  name={meal.name}
                  description={meal.description}
                  seasonalIngredients={meal.seasonalIngredients}
                  mealType={meal.mealType}
                  children={children}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <CalendarDays className="h-12 w-12 text-muted-foreground/50" />
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold">No meal plan yet</h3>
        <p className="text-sm text-muted-foreground">
          Generate your first weekly plan!
        </p>
      </div>
    </div>
  );
}
