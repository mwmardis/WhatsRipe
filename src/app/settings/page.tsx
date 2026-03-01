export const dynamic = "force-dynamic";

import { getOrCreateHousehold } from "./actions";
import { HouseholdForm } from "@/components/settings/household-form";
import { ChildrenManager } from "@/components/settings/children-manager";
import { FamilyMembers } from "@/components/settings/family-members";

export default async function SettingsPage() {
  const household = await getOrCreateHousehold();

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-28 space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your household profile and meal preferences.
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="h-0.5 w-8 rounded-full bg-primary/60" />
          <div className="h-0.5 w-3 rounded-full bg-primary/30" />
          <div className="h-0.5 w-1.5 rounded-full bg-primary/15" />
        </div>
      </div>

      <div className="animate-fade-up space-y-6">
        <HouseholdForm
          initialData={{
            dietaryPreferences: household.dietaryPreferences,
            allergies: household.allergies,
            likedIngredients: household.likedIngredients,
            dislikedIngredients: household.dislikedIngredients,
            planBreakfast: household.planBreakfast,
            planLunch: household.planLunch,
            useSeasonalFoods: household.useSeasonalFoods,
            busyDays: household.busyDays,
            pickyEaterMode: household.pickyEaterMode,
            weeklyBudget: household.weeklyBudget,
            mealPrepDay: household.mealPrepDay,
            planWeeks: household.planWeeks,
            preferredCookingMethods: household.preferredCookingMethods,
          }}
        />

        <ChildrenManager initialChildren={household.children} />

        <FamilyMembers initialMembers={household.familyMembers} />
      </div>
    </div>
  );
}
