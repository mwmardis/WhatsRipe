"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sprout, ChevronDown, ChevronUp, Star, TrendingUp } from "lucide-react";
import { getMilestonesForAge, type FeedingMilestone } from "@/data/milestones";

interface GrowthMilestonesProps {
  children: { id: string; name: string; birthdate: Date }[];
}

function getAgeInMonths(birthdate: Date): number {
  const now = new Date();
  return (
    (now.getFullYear() - birthdate.getFullYear()) * 12 +
    (now.getMonth() - birthdate.getMonth())
  );
}

function formatAge(ageMonths: number): string {
  if (ageMonths < 12) return `${ageMonths}mo`;
  const years = Math.floor(ageMonths / 12);
  const remaining = ageMonths % 12;
  if (remaining === 0) return `${years}y`;
  return `${years}y ${remaining}mo`;
}

function MilestoneCard({
  milestone,
  variant,
}: {
  milestone: FeedingMilestone;
  variant: "current" | "upcoming" | "past";
}) {
  const isCurrent = variant === "current";
  const isUpcoming = variant === "upcoming";
  const isPast = variant === "past";

  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        isCurrent
          ? "border-primary/30 bg-[rgba(196,101,42,0.04)]"
          : isUpcoming
            ? "border-border/40 bg-muted/30 opacity-75"
            : "border-border/40 bg-card"
      }`}
    >
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          {isCurrent && (
            <Star className="h-4 w-4 text-primary/70 fill-primary/30" />
          )}
          <h4
            className={`font-semibold text-[15px] ${
              isPast ? "text-muted-foreground" : "text-foreground"
            }`}
          >
            {milestone.title}
          </h4>
          <Badge
            variant="secondary"
            className={`rounded-full border-0 text-[11px] font-medium ${
              isCurrent
                ? "bg-[rgba(196,101,42,0.08)] text-primary/80"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {milestone.ageMonths}mo
          </Badge>
          {isUpcoming && (
            <span className="ml-auto text-[11px] font-medium text-muted-foreground">
              Coming up at {milestone.ageMonths} months
            </span>
          )}
        </div>

        {/* Description */}
        <p
          className={`text-sm leading-relaxed ${
            isPast ? "text-muted-foreground/70" : "text-muted-foreground"
          }`}
        >
          {milestone.description}
        </p>

        {/* New Foods */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
            New foods to try
          </span>
          <div className="flex flex-wrap gap-1.5">
            {milestone.newFoods.map((food) => (
              <Badge
                key={food}
                variant="secondary"
                className={`rounded-full border-0 px-2 py-0.5 text-[11px] font-medium ${
                  isCurrent
                    ? "bg-[rgba(196,101,42,0.08)] text-primary/80"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {food}
              </Badge>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
            Tips
          </span>
          <ul className="flex flex-col gap-1.5 pl-4">
            {milestone.tips.map((tip, i) => (
              <li
                key={i}
                className={`list-disc text-sm leading-relaxed marker:text-primary/30 ${
                  isPast ? "text-foreground/50" : "text-foreground/70"
                }`}
              >
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ChildMilestones({
  child,
}: {
  child: { id: string; name: string; birthdate: Date };
}) {
  const [showPast, setShowPast] = useState(false);
  const ageMonths = getAgeInMonths(child.birthdate);
  const { current, upcoming, past } = getMilestonesForAge(ageMonths);

  if (!current && !upcoming) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* Child header */}
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm text-foreground">
          {child.name}
        </span>
        <span className="text-[13px] text-muted-foreground">
          ({formatAge(ageMonths)})
        </span>
      </div>

      {/* Current milestone */}
      {current && <MilestoneCard milestone={current} variant="current" />}

      {/* Upcoming milestone */}
      {upcoming && <MilestoneCard milestone={upcoming} variant="upcoming" />}

      {/* Past milestones (collapsible) */}
      {past.length > 0 && (
        <div className="flex flex-col gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-fit gap-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setShowPast(!showPast)}
          >
            {showPast ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            {showPast ? "Hide" : "Show"} {past.length} past{" "}
            {past.length === 1 ? "milestone" : "milestones"}
          </Button>

          {showPast && (
            <div className="flex flex-col gap-2.5">
              {past.map((milestone) => (
                <MilestoneCard
                  key={milestone.ageMonths}
                  milestone={milestone}
                  variant="past"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function GrowthMilestones({ children }: GrowthMilestonesProps) {
  // Filter to children 24 months or younger who would have relevant milestones
  const relevantChildren = children.filter((child) => {
    const ageMonths = getAgeInMonths(child.birthdate);
    const { current, upcoming } = getMilestonesForAge(ageMonths);
    return current !== null || upcoming !== null;
  });

  if (relevantChildren.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* Section heading */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(196,101,42,0.08)]">
          <Sprout className="h-4.5 w-4.5 text-primary/70" />
        </div>
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg font-semibold">
            Growth Milestones
          </h2>
          <TrendingUp className="h-4 w-4 text-muted-foreground/50" />
        </div>
      </div>

      {/* Per-child milestones */}
      <div className="flex flex-col gap-6">
        {relevantChildren.map((child) => (
          <ChildMilestones key={child.id} child={child} />
        ))}
      </div>
    </div>
  );
}
