"use client";

import { useState, useCallback, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updateHousehold } from "@/app/settings/actions";
import { X } from "lucide-react";

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

interface HouseholdData {
  dietaryPreferences: string;
  allergies: string;
  likedIngredients: string;
  dislikedIngredients: string;
  planBreakfast: boolean;
  planLunch: boolean;
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
      <Label>{label}</Label>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 pr-1">
            {tag}
            <button
              type="button"
              onClick={() => onRemove(tag)}
              className="ml-1 rounded-full hover:bg-muted p-0.5"
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
      />
      {unusedSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {unusedSuggestions.map((suggestion) => (
            <Badge
              key={suggestion}
              variant="outline"
              className="cursor-pointer hover:bg-accent"
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
  const [planBreakfast, setPlanBreakfast] = useState(
    initialData.planBreakfast
  );
  const [planLunch, setPlanLunch] = useState(initialData.planLunch);
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
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Household Preferences</CardTitle>
        <CardDescription>
          Configure your dietary needs and meal planning preferences.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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

        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="plan-breakfast">Plan Breakfast</Label>
              <p className="text-sm text-muted-foreground">
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
              <Label htmlFor="plan-lunch">Plan Lunch</Label>
              <p className="text-sm text-muted-foreground">
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
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : saved ? "Saved!" : "Save Preferences"}
        </Button>
      </CardContent>
    </Card>
  );
}
