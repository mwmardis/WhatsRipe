"use client";

import { Badge } from "@/components/ui/badge";
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(196,101,42,0.08)]">
          <Baby className="h-4.5 w-4.5 text-primary/70" />
        </div>
        <h2 className="font-display text-lg font-semibold">
          Baby & Toddler Adaptations
        </h2>
      </div>

      {adaptations.map((adaptation, i) => {
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
          <div key={i} className="rounded-xl border border-border/60 bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-semibold text-[15px]">
                {matchedChild
                  ? `${matchedChild.name} (${getAgeInMonths(matchedChild.birthdate)}mo)`
                  : adaptation.stageName}
              </h3>
              <Badge
                variant="secondary"
                className="rounded-full border-0 text-[11px] font-medium bg-[rgba(196,101,42,0.08)] text-primary/80"
              >
                {adaptation.stageName}
              </Badge>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {adaptation.instructions}
              </p>
              {adaptation.modifications.length > 0 && (
                <ul className="flex flex-col gap-1.5 pl-4 pt-1">
                  {adaptation.modifications.map((mod, j) => (
                    <li
                      key={j}
                      className="list-disc text-sm text-foreground/70 leading-relaxed marker:text-primary/30"
                    >
                      {mod}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
