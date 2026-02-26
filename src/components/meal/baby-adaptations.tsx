"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Baby } from "lucide-react";
import { getFoodStage, getFoodStageLabel } from "@/lib/food-stages";
import type { BabyAdaptation } from "@/app/actions/meal-actions";

interface ChildInfo {
  id: string;
  name: string;
  birthdate: Date;
}

interface BabyAdaptationsProps {
  adaptations: BabyAdaptation[] | null;
  children: ChildInfo[];
}

function getAgeInMonths(birthdate: Date): number {
  const now = new Date();
  return (
    (now.getFullYear() - birthdate.getFullYear()) * 12 +
    (now.getMonth() - birthdate.getMonth())
  );
}

export function BabyAdaptations({
  adaptations,
  children,
}: BabyAdaptationsProps) {
  if (!adaptations || adaptations.length === 0 || children.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Baby className="h-5 w-5" />
        Baby & Toddler Adaptations
      </h2>

      {adaptations.map((adaptation, i) => {
        // Try to match an adaptation to a child by stage name
        const matchedChild = children.find((child) => {
          const stage = getFoodStage(child.birthdate);
          const label = getFoodStageLabel(stage);
          return (
            adaptation.stageName === stage ||
            adaptation.stageName === label ||
            adaptation.stageName.toLowerCase().includes(stage) ||
            adaptation.stageName.toLowerCase().includes(child.name.toLowerCase())
          );
        });

        return (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">
                  {matchedChild
                    ? `${matchedChild.name} (${getAgeInMonths(matchedChild.birthdate)}mo)`
                    : adaptation.stageName}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {adaptation.stageName}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                {adaptation.instructions}
              </p>
              {adaptation.modifications.length > 0 && (
                <ul className="flex flex-col gap-1 pl-4">
                  {adaptation.modifications.map((mod, j) => (
                    <li
                      key={j}
                      className="list-disc text-sm text-muted-foreground"
                    >
                      {mod}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
