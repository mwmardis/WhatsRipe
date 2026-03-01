"use client";

import { useState, useCallback, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateHousehold } from "@/app/settings/actions";
import { X, Check } from "lucide-react";

const DIETARY_OPTIONS = [
  "vegetarian",
  "vegan",
  "gluten-free",
  "dairy-free",
  "nut-free",
  "low-sodium",
  "halal",
  "kosher",
];

const COMMON_ALLERGIES = [
  "peanuts",
  "tree nuts",
  "milk",
  "eggs",
  "wheat",
  "soy",
  "fish",
  "shellfish",
  "sesame",
];

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const COOKING_METHODS = [
  { value: "standard", label: "Standard" },
  { value: "slow-cooker", label: "Slow Cooker" },
  { value: "instant-pot", label: "Instant Pot" },
];

interface HouseholdData {
  dietaryPreferences: string;
  allergies: string;
  likedIngredients: string;
  dislikedIngredients: string;
  planBreakfast: boolean;
  planLunch: boolean;
  useSeasonalFoods: boolean;
  busyDays: string;
  pickyEaterMode: boolean;
  weeklyBudget: number | null;
  mealPrepDay: number | null;
  planWeeks: number;
  preferredCookingMethods: string;
}

interface HouseholdFormProps {
  initialData: HouseholdData;
}

function parseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseJsonNumberArray(value: string): number[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function TagInput({
  label,
  description,
  tags,
  onAdd,
  onRemove,
  suggestions,
  placeholder,
}: {
  label: string;
  description?: string;
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  suggestions?: string[];
  placeholder?: string;
}) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const value = inputValue.trim().toLowerCase();
      if (value && !tags.includes(value)) {
        onAdd(value);
      }
      setInputValue("");
    }
  };

  const unusedSuggestions = suggestions?.filter((s) => !tags.includes(s)) ?? [];

  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-foreground">{label}</Label>
      {description && (
        <p className="text-[13px] text-muted-foreground">{description}</p>
      )}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="gap-1 pr-1 rounded-full text-xs"
          >
            {tag}
            <button
              type="button"
              onClick={() => onRemove(tag)}
              className="ml-1 rounded-full hover:bg-muted p-0.5 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? "Type and press Enter to add"}
        className="rounded-lg"
      />
      {unusedSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {unusedSuggestions.map((suggestion) => (
            <Badge
              key={suggestion}
              variant="outline"
              className="cursor-pointer hover:bg-primary/10 hover:border-primary/30 rounded-full text-xs transition-colors"
              onClick={() => onAdd(suggestion)}
            >
              + {suggestion}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export function HouseholdForm({ initialData }: HouseholdFormProps) {
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>(
    parseJsonArray(initialData.dietaryPreferences)
  );
  const [allergies, setAllergies] = useState<string[]>(
    parseJsonArray(initialData.allergies)
  );
  const [likedIngredients, setLikedIngredients] = useState<string[]>(
    parseJsonArray(initialData.likedIngredients)
  );
  const [dislikedIngredients, setDislikedIngredients] = useState<string[]>(
    parseJsonArray(initialData.dislikedIngredients)
  );
  const [planBreakfast, setPlanBreakfast] = useState(initialData.planBreakfast);
  const [planLunch, setPlanLunch] = useState(initialData.planLunch);
  const [useSeasonalFoods, setUseSeasonalFoods] = useState(initialData.useSeasonalFoods);
  const [busyDays, setBusyDays] = useState<number[]>(
    parseJsonNumberArray(initialData.busyDays)
  );
  const [pickyEaterMode, setPickyEaterMode] = useState(initialData.pickyEaterMode);
  const [weeklyBudget, setWeeklyBudget] = useState<string>(
    initialData.weeklyBudget?.toString() ?? ""
  );
  const [mealPrepDay, setMealPrepDay] = useState<number | null>(initialData.mealPrepDay);
  const [planWeeks, setPlanWeeks] = useState(initialData.planWeeks);
  const [preferredCookingMethods, setPreferredCookingMethods] = useState<string[]>(
    parseJsonArray(initialData.preferredCookingMethods)
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const addTag = useCallback(
    (setter: React.Dispatch<React.SetStateAction<string[]>>) =>
      (tag: string) => {
        setter((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
        setSaved(false);
      },
    []
  );

  const removeTag = useCallback(
    (setter: React.Dispatch<React.SetStateAction<string[]>>) =>
      (tag: string) => {
        setter((prev) => prev.filter((t) => t !== tag));
        setSaved(false);
      },
    []
  );

  const toggleBusyDay = (day: number) => {
    setBusyDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
    setSaved(false);
  };

  const toggleCookingMethod = (method: string) => {
    setPreferredCookingMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateHousehold({
        dietaryPreferences,
        allergies,
        likedIngredients,
        dislikedIngredients,
        planBreakfast,
        planLunch,
        useSeasonalFoods,
        busyDays,
        pickyEaterMode,
        weeklyBudget: weeklyBudget ? parseFloat(weeklyBudget) : null,
        mealPrepDay,
        planWeeks,
        preferredCookingMethods,
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card">
      <div className="p-5 pb-0">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Household Preferences
        </h2>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Configure your dietary needs and meal planning preferences.
        </p>
      </div>
      <div className="p-5 space-y-6">
        <TagInput
          label="Dietary Preferences"
          tags={dietaryPreferences}
          onAdd={addTag(setDietaryPreferences)}
          onRemove={removeTag(setDietaryPreferences)}
          suggestions={DIETARY_OPTIONS}
          placeholder="Add dietary preference..."
        />

        <TagInput
          label="Allergies"
          description="Select common allergies or type your own."
          tags={allergies}
          onAdd={addTag(setAllergies)}
          onRemove={removeTag(setAllergies)}
          suggestions={COMMON_ALLERGIES}
          placeholder="Add allergy..."
        />

        <TagInput
          label="Liked Ingredients"
          description="Ingredients your household enjoys."
          tags={likedIngredients}
          onAdd={addTag(setLikedIngredients)}
          onRemove={removeTag(setLikedIngredients)}
          placeholder="Add liked ingredient..."
        />

        <TagInput
          label="Disliked Ingredients"
          description="Ingredients to avoid in meal plans."
          tags={dislikedIngredients}
          onAdd={addTag(setDislikedIngredients)}
          onRemove={removeTag(setDislikedIngredients)}
          placeholder="Add disliked ingredient..."
        />

        {/* Meal Planning Toggles */}
        <div className="space-y-4 pt-2 border-t border-border/40">
          <div className="flex items-center justify-between pt-4">
            <div>
              <Label htmlFor="plan-breakfast" className="font-semibold text-sm">
                Plan Breakfast
              </Label>
              <p className="text-[13px] text-muted-foreground">
                Include breakfast in weekly meal plans.
              </p>
            </div>
            <Switch
              id="plan-breakfast"
              checked={planBreakfast}
              onCheckedChange={(checked) => {
                setPlanBreakfast(checked);
                setSaved(false);
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="plan-lunch" className="font-semibold text-sm">
                Plan Lunch
              </Label>
              <p className="text-[13px] text-muted-foreground">
                Include lunch in weekly meal plans.
              </p>
            </div>
            <Switch
              id="plan-lunch"
              checked={planLunch}
              onCheckedChange={(checked) => {
                setPlanLunch(checked);
                setSaved(false);
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="use-seasonal" className="font-semibold text-sm">
                Feature Seasonal Ingredients
              </Label>
              <p className="text-[13px] text-muted-foreground">
                Prioritize what&apos;s fresh and in season.
              </p>
            </div>
            <Switch
              id="use-seasonal"
              checked={useSeasonalFoods}
              onCheckedChange={(checked) => {
                setUseSeasonalFoods(checked);
                setSaved(false);
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="picky-eater" className="font-semibold text-sm">
                Picky Eater Mode
              </Label>
              <p className="text-[13px] text-muted-foreground">
                Hidden veggies &amp; deconstructed meal options.
              </p>
            </div>
            <Switch
              id="picky-eater"
              checked={pickyEaterMode}
              onCheckedChange={(checked) => {
                setPickyEaterMode(checked);
                setSaved(false);
              }}
            />
          </div>
        </div>

        {/* Multi-Week Planning */}
        <div className="space-y-3 pt-2 border-t border-border/40">
          <div className="pt-4">
            <Label className="font-semibold text-sm">Plan Ahead</Label>
            <p className="text-[13px] text-muted-foreground">
              Number of weeks to generate meal plans for.
            </p>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((weeks) => (
              <button
                key={weeks}
                type="button"
                onClick={() => {
                  setPlanWeeks(weeks);
                  setSaved(false);
                }}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  planWeeks === weeks
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                {weeks}w
              </button>
            ))}
          </div>
        </div>

        {/* Busy Days */}
        <div className="space-y-3 pt-2 border-t border-border/40">
          <div className="pt-4">
            <Label className="font-semibold text-sm">Busy Days</Label>
            <p className="text-[13px] text-muted-foreground">
              Get quick meals (&lt;20 min prep) on hectic days.
            </p>
          </div>
          <div className="flex gap-1.5">
            {DAY_NAMES.map((name, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleBusyDay(i)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  busyDays.includes(i)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Cooking Methods */}
        <div className="space-y-3 pt-2 border-t border-border/40">
          <div className="pt-4">
            <Label className="font-semibold text-sm">Preferred Cooking Methods</Label>
            <p className="text-[13px] text-muted-foreground">
              Include slow cooker or instant pot meals in your plans.
            </p>
          </div>
          <div className="flex gap-2">
            {COOKING_METHODS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => toggleCookingMethod(value)}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                  preferredCookingMethods.includes(value)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div className="space-y-3 pt-2 border-t border-border/40">
          <div className="pt-4">
            <Label htmlFor="weekly-budget" className="font-semibold text-sm">
              Weekly Budget
            </Label>
            <p className="text-[13px] text-muted-foreground">
              Set a target to get budget-friendly meal suggestions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">$</span>
            <Input
              id="weekly-budget"
              type="number"
              min="0"
              step="10"
              value={weeklyBudget}
              onChange={(e) => {
                setWeeklyBudget(e.target.value);
                setSaved(false);
              }}
              placeholder="e.g., 150"
              className="rounded-lg w-32"
            />
            <span className="text-[13px] text-muted-foreground">/ week</span>
          </div>
        </div>

        {/* Meal Prep Day */}
        <div className="space-y-3 pt-2 border-t border-border/40">
          <div className="pt-4">
            <Label className="font-semibold text-sm">Meal Prep Day</Label>
            <p className="text-[13px] text-muted-foreground">
              Choose a day for batch cooking prep schedules.
            </p>
          </div>
          <Select
            value={mealPrepDay !== null ? mealPrepDay.toString() : "none"}
            onValueChange={(val) => {
              setMealPrepDay(val === "none" ? null : parseInt(val));
              setSaved(false);
            }}
          >
            <SelectTrigger className="w-40 rounded-lg">
              <SelectValue placeholder="No prep day" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No prep day</SelectItem>
              {DAY_NAMES.map((name, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {name === "Mon" ? "Monday" : name === "Tue" ? "Tuesday" : name === "Wed" ? "Wednesday" : name === "Thu" ? "Thursday" : name === "Fri" ? "Friday" : name === "Sat" ? "Saturday" : "Sunday"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl"
        >
          {saving ? (
            "Saving..."
          ) : saved ? (
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4" />
              Saved!
            </span>
          ) : (
            "Save Preferences"
          )}
        </Button>
      </div>
    </div>
  );
}
