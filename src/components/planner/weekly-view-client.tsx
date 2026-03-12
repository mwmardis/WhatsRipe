"use client";

import { WeeklyView } from "./weekly-view";
import { deleteMeal } from "@/app/actions/meal-actions";
import { skipDay } from "@/app/actions/plan-actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ComponentProps } from "react";

type WeeklyViewClientProps = Omit<ComponentProps<typeof WeeklyView>, "onDeleteMeal" | "onSkipDay">;

export function WeeklyViewClient(props: WeeklyViewClientProps) {
  const router = useRouter();

  async function handleDeleteMeal(mealId: string) {
    try {
      await deleteMeal(mealId);
      router.refresh();
      toast.success("Meal removed");
    } catch {
      toast.error("Failed to remove meal");
    }
  }

  async function handleSkipDay(dailyPlanId: string) {
    try {
      await skipDay(dailyPlanId);
      router.refresh();
      toast.success("Day skipped");
    } catch {
      toast.error("Failed to skip day");
    }
  }

  return (
    <WeeklyView
      {...props}
      onDeleteMeal={handleDeleteMeal}
      onSkipDay={handleSkipDay}
    />
  );
}
