"use client";

import { Badge } from "@/components/ui/badge";
import type { Season } from "@/data/seasonal-ingredients";
import { Leaf, Sun, TreeDeciduous, Snowflake } from "lucide-react";

const seasonConfig: Record<
  Season,
  {
    label: string;
    icon: React.ElementType;
    className: string;
    bgColor: string;
    badgeBg: string;
  }
> = {
  spring: {
    label: "Spring",
    icon: Leaf,
    className: "text-green-700",
    bgColor: "rgba(34, 197, 94, 0.08)",
    badgeBg: "rgba(34, 197, 94, 0.12)",
  },
  summer: {
    label: "Summer",
    icon: Sun,
    className: "text-amber-600",
    bgColor: "rgba(245, 158, 11, 0.08)",
    badgeBg: "rgba(245, 158, 11, 0.12)",
  },
  fall: {
    label: "Fall",
    icon: TreeDeciduous,
    className: "text-orange-700",
    bgColor: "rgba(234, 88, 12, 0.08)",
    badgeBg: "rgba(234, 88, 12, 0.12)",
  },
  winter: {
    label: "Winter",
    icon: Snowflake,
    className: "text-blue-600",
    bgColor: "rgba(59, 130, 246, 0.08)",
    badgeBg: "rgba(59, 130, 246, 0.12)",
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
    <div
      className="flex flex-col gap-2 rounded-lg p-3"
      style={{ backgroundColor: config.bgColor }}
    >
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${config.className}`} />
        <span className="text-lg font-semibold">{config.label} Season</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {ingredients.slice(0, 6).map((ingredient) => (
          <Badge
            key={ingredient}
            variant="secondary"
            className="text-xs"
            style={{ backgroundColor: config.badgeBg }}
          >
            {ingredient}
          </Badge>
        ))}
      </div>
    </div>
  );
}
