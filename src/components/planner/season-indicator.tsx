"use client";

import { Badge } from "@/components/ui/badge";
import type { Season } from "@/data/seasonal-ingredients";
import { Leaf, Sun, TreeDeciduous, Snowflake } from "lucide-react";

const seasonConfig: Record<
  Season,
  {
    label: string;
    icon: React.ElementType;
    iconColor: string;
    bgGradient: string;
    badgeBg: string;
    badgeText: string;
    dotColor: string;
  }
> = {
  spring: {
    label: "Spring",
    icon: Leaf,
    iconColor: "#4a7c4e",
    bgGradient: "linear-gradient(135deg, rgba(90,143,92,0.1) 0%, rgba(90,143,92,0.02) 100%)",
    badgeBg: "rgba(90,143,92,0.12)",
    badgeText: "#3d5941",
    dotColor: "#5A8F5C",
  },
  summer: {
    label: "Summer",
    icon: Sun,
    iconColor: "#b8781e",
    bgGradient: "linear-gradient(135deg, rgba(212,145,42,0.1) 0%, rgba(212,145,42,0.02) 100%)",
    badgeBg: "rgba(212,145,42,0.12)",
    badgeText: "#7a5518",
    dotColor: "#D4912A",
  },
  fall: {
    label: "Fall",
    icon: TreeDeciduous,
    iconColor: "#a85522",
    bgGradient: "linear-gradient(135deg, rgba(196,101,42,0.1) 0%, rgba(196,101,42,0.02) 100%)",
    badgeBg: "rgba(196,101,42,0.12)",
    badgeText: "#7a3f18",
    dotColor: "#C4652A",
  },
  winter: {
    label: "Winter",
    icon: Snowflake,
    iconColor: "#4a6b85",
    bgGradient: "linear-gradient(135deg, rgba(91,123,154,0.1) 0%, rgba(91,123,154,0.02) 100%)",
    badgeBg: "rgba(91,123,154,0.12)",
    badgeText: "#3a5568",
    dotColor: "#5B7B9A",
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
    <div className="animate-fade-up">
      <div
        className="flex flex-col gap-3 rounded-xl border border-border/50 p-4"
        style={{ background: config.bgGradient }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg animate-gentle-pulse"
            style={{ backgroundColor: config.badgeBg }}
          >
            <Icon className="h-4.5 w-4.5" style={{ color: config.iconColor }} />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              {config.label} Season
            </h2>
            <p className="text-xs text-muted-foreground">What&apos;s fresh right now</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {ingredients.slice(0, 6).map((ingredient, i) => (
            <Badge
              key={ingredient}
              variant="secondary"
              className="rounded-full border-0 px-2.5 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: config.badgeBg,
                color: config.badgeText,
                animationDelay: `${i * 50}ms`,
              }}
            >
              {ingredient}
            </Badge>
          ))}
        </div>
      </div>

      {/* Decorative seasonal divider */}
      <div className="flex items-center justify-center gap-2 py-2">
        <div className="h-px flex-1" style={{ backgroundColor: config.dotColor, opacity: 0.15 }} />
        <div
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: config.dotColor, opacity: 0.3 }}
        />
        <div className="h-px flex-1" style={{ backgroundColor: config.dotColor, opacity: 0.15 }} />
      </div>
    </div>
  );
}
