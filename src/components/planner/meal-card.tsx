"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UtensilsCrossed, Baby } from "lucide-react";
import { getFoodStage, getFoodStageLabel } from "@/lib/food-stages";

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
    const label = getFoodStageLabel(stage);

    // Create a short description based on stage
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

export function MealCard({
  id,
  name,
  description,
  seasonalIngredients,
  mealType,
  children,
}: MealCardProps) {
  const adaptationSummary = getBabyAdaptationSummary(children);

  return (
    <Link href={`/meal/${id}`}>
      <Card className="gap-3 py-4 transition-colors hover:bg-accent/50">
        <CardHeader className="gap-1 px-4">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium uppercase text-muted-foreground">
              {mealTypeLabels[mealType] ?? mealType}
            </span>
          </div>
          <CardTitle className="text-base">{name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 px-4">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>

          {seasonalIngredients.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {seasonalIngredients.map((ingredient) => (
                <Badge
                  key={ingredient}
                  variant="outline"
                  className="text-xs"
                >
                  {ingredient}
                </Badge>
              ))}
            </div>
          )}

          {adaptationSummary && (
            <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Baby className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="capitalize">{adaptationSummary}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
