import { getOrCreateHousehold } from "./actions";
import { HouseholdForm } from "@/components/settings/household-form";
import { ChildrenManager } from "@/components/settings/children-manager";

export default async function SettingsPage() {
  const household = await getOrCreateHousehold();

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your household profile and preferences.
        </p>
      </div>

      <HouseholdForm
        initialData={{
          dietaryPreferences: household.dietaryPreferences,
          allergies: household.allergies,
          likedIngredients: household.likedIngredients,
          dislikedIngredients: household.dislikedIngredients,
          planBreakfast: household.planBreakfast,
          planLunch: household.planLunch,
        }}
      />

      <ChildrenManager initialChildren={household.children} />
    </div>
  );
}
