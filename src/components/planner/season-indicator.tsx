"use client";

import { Badge } from "@/components/ui/badge";
import type { Season } from "@/data/seasonal-ingredients";
import { Leaf, Sun, TreeDeciduous, Snowflake } from "lucide-react";

const seasonConfig: Record<
  Season,
  { label: string; icon: React.ElementType; className: string }
> = {
  spring: {
    label: "Spring",
    icon: Leaf,
    className: "text-green-600",
  },
  summer: {
    label: "Summer",
    icon: Sun,
    className: "text-amber-500",
  },
  fall: {
    label: "Fall",
    icon: TreeDeciduous,
    className: "text-orange-600",
  },
  winter: {
    label: "Winter",
    icon: Snowflake,
    className: "text-blue-500",
  },
};

interface SeasonIndicatorProps {
  season: Season;
  ingredients: string[];
}

export function SeasonIndicator({ season, ingredients }: SeasonIndicatorProps) {
  const config = seasonConfig[season];
  const Icon = config.icon;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${config.className}`} />
        <span className="text-lg font-semibold">{config.label} Season</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {ingredients.slice(0, 6).map((ingredient) => (
          <Badge key={ingredient} variant="secondary" className="text-xs">
            {ingredient}
          </Badge>
        ))}
      </div>
    </div>
  );
}
