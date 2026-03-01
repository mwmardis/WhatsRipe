"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  Apple,
  Salad,
  Beef,
  Wheat,
  Droplets,
  Heart,
} from "lucide-react";
import { toast } from "sonner";
import {
  generateNutritionSummary,
  type NutritionSummary,
} from "@/app/actions/nutrition-actions";

interface NutritionViewProps {
  weeklyPlanId: string | null;
}

function StatusBadge({ status }: { status: "good" | "low" | "high" }) {
  if (status === "good") {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-500/10">
        Good
      </Badge>
    );
  }
  if (status === "low") {
    return (
      <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/20 dark:text-amber-400 dark:bg-amber-500/10">
        Low
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-500/15 text-red-700 border-red-500/20 dark:text-red-400 dark:bg-red-500/10">
      High
    </Badge>
  );
}

function statusColor(status: "good" | "low" | "high") {
  if (status === "good") return "border-emerald-500/20 bg-emerald-500/5";
  if (status === "low") return "border-amber-500/20 bg-amber-500/5";
  return "border-red-500/20 bg-red-500/5";
}

function NutrientIcon({ nutrient }: { nutrient: string }) {
  const lower = nutrient.toLowerCase();
  if (lower.includes("iron") || lower.includes("zinc"))
    return <Beef className="size-4 text-muted-foreground/70" />;
  if (lower.includes("calcium") || lower.includes("vitamin d"))
    return <Droplets className="size-4 text-muted-foreground/70" />;
  if (lower.includes("vitamin c") || lower.includes("vitamin a"))
    return <Apple className="size-4 text-muted-foreground/70" />;
  if (lower.includes("omega"))
    return <Heart className="size-4 text-muted-foreground/70" />;
  if (lower.includes("fiber"))
    return <Wheat className="size-4 text-muted-foreground/70" />;
  return <Salad className="size-4 text-muted-foreground/70" />;
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-36" />
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    </div>
  );
}

function NutrientCoverageSection({
  coverage,
}: {
  coverage: NutritionSummary["nutrientCoverage"];
}) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
        Nutrient Coverage
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {coverage.map((item, i) => (
          <div
            key={item.nutrient}
            className={`flex flex-col gap-2 rounded-xl border p-3 ${statusColor(item.status)} animate-fade-up`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <NutrientIcon nutrient={item.nutrient} />
                <span className="text-sm font-medium text-foreground">
                  {item.nutrient}
                </span>
              </div>
              <StatusBadge status={item.status} />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {item.note}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DailyMacrosSection({
  summaries,
}: {
  summaries: NutritionSummary["dailySummaries"];
}) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
        Daily Macros
      </h2>
      <div className="flex flex-col gap-2.5">
        {summaries.map((day, i) => (
          <Card
            key={day.day}
            className="rounded-xl border-border/60 py-3 gap-0 animate-fade-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <CardHeader className="px-4 pb-2">
              <CardTitle className="font-display text-sm font-semibold tracking-tight">
                {day.day}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <div className="grid grid-cols-5 gap-2">
                <div className="flex flex-col items-center gap-0.5 rounded-lg bg-muted/50 p-1.5">
                  <span className="text-xs text-muted-foreground">Cal</span>
                  <span className="text-sm font-semibold text-foreground">
                    {day.calories}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-0.5 rounded-lg bg-muted/50 p-1.5">
                  <span className="text-xs text-muted-foreground">Protein</span>
                  <span className="text-sm font-semibold text-foreground">
                    {day.protein}g
                  </span>
                </div>
                <div className="flex flex-col items-center gap-0.5 rounded-lg bg-muted/50 p-1.5">
                  <span className="text-xs text-muted-foreground">Carbs</span>
                  <span className="text-sm font-semibold text-foreground">
                    {day.carbs}g
                  </span>
                </div>
                <div className="flex flex-col items-center gap-0.5 rounded-lg bg-muted/50 p-1.5">
                  <span className="text-xs text-muted-foreground">Fat</span>
                  <span className="text-sm font-semibold text-foreground">
                    {day.fat}g
                  </span>
                </div>
                <div className="flex flex-col items-center gap-0.5 rounded-lg bg-muted/50 p-1.5">
                  <span className="text-xs text-muted-foreground">Fiber</span>
                  <span className="text-sm font-semibold text-foreground">
                    {day.fiber}g
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function WeeklyHighlightsSection({
  highlights,
}: {
  highlights: NutritionSummary["weeklyHighlights"];
}) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
        Weekly Highlights
      </h2>
      <div className="flex flex-col gap-3">
        {highlights.strengths.length > 0 && (
          <Card className="rounded-xl border-emerald-500/20 bg-emerald-500/5 py-4 gap-2 animate-fade-up">
            <CardHeader className="px-4 pb-0">
              <CardTitle className="font-display text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <div className="size-2 rounded-full bg-emerald-500" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <ul className="flex flex-col gap-1.5">
                {highlights.strengths.map((item, i) => (
                  <li
                    key={i}
                    className="text-sm text-foreground/80 leading-relaxed flex items-start gap-2"
                  >
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-emerald-500/60" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {highlights.gaps.length > 0 && (
          <Card
            className="rounded-xl border-amber-500/20 bg-amber-500/5 py-4 gap-2 animate-fade-up"
            style={{ animationDelay: "60ms" }}
          >
            <CardHeader className="px-4 pb-0">
              <CardTitle className="font-display text-sm font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <div className="size-2 rounded-full bg-amber-500" />
                Nutritional Gaps
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <ul className="flex flex-col gap-1.5">
                {highlights.gaps.map((item, i) => (
                  <li
                    key={i}
                    className="text-sm text-foreground/80 leading-relaxed flex items-start gap-2"
                  >
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-amber-500/60" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {highlights.suggestions.length > 0 && (
          <Card
            className="rounded-xl border-blue-500/20 bg-blue-500/5 py-4 gap-2 animate-fade-up"
            style={{ animationDelay: "120ms" }}
          >
            <CardHeader className="px-4 pb-0">
              <CardTitle className="font-display text-sm font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                <div className="size-2 rounded-full bg-blue-500" />
                Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <ul className="flex flex-col gap-1.5">
                {highlights.suggestions.map((item, i) => (
                  <li
                    key={i}
                    className="text-sm text-foreground/80 leading-relaxed flex items-start gap-2"
                  >
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-blue-500/60" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export function NutritionView({ weeklyPlanId }: NutritionViewProps) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<NutritionSummary | null>(null);

  if (!weeklyPlanId) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border/60 bg-card/50 p-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <Apple className="size-7 text-muted-foreground/60" />
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-[260px]">
          No meal plan found. Generate a weekly meal plan first, then come back
          to view your nutrition summary.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-center gap-3 rounded-xl border border-border/60 bg-card p-6">
          <Loader2 className="size-5 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Analyzing your meal plan nutrition...
          </p>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 rounded-xl border-2 border-dashed border-primary/30 bg-secondary/30 p-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Salad className="size-7 text-primary" />
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-[260px]">
          Your meal plan is ready. Analyze its nutritional balance to see
          macro breakdowns, nutrient coverage, and personalized recommendations.
        </p>
        <Button
          onClick={async () => {
            setLoading(true);
            try {
              const result = await generateNutritionSummary(weeklyPlanId);
              setSummary(result);
            } catch {
              toast.error("Failed to analyze nutrition. Please try again.");
            } finally {
              setLoading(false);
            }
          }}
          className="rounded-xl shadow-sm"
        >
          <Salad className="size-4 mr-2" />
          Analyze Nutrition
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <NutrientCoverageSection coverage={summary.nutrientCoverage} />
      <DailyMacrosSection summaries={summary.dailySummaries} />
      <WeeklyHighlightsSection highlights={summary.weeklyHighlights} />

      <div className="flex justify-center pb-4">
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg"
          onClick={async () => {
            setLoading(true);
            try {
              const result = await generateNutritionSummary(weeklyPlanId);
              setSummary(result);
            } catch {
              toast.error("Failed to re-analyze nutrition. Please try again.");
            } finally {
              setLoading(false);
            }
          }}
        >
          <Loader2 className="size-3.5 mr-1" />
          Re-analyze
        </Button>
      </div>
    </div>
  );
}
