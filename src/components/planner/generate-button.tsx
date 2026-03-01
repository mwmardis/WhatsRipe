"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { savePlan } from "@/app/actions/plan-actions";
import type { Season } from "@/data/seasonal-ingredients";

const seasonButtonColors: Record<Season, { bg: string; hover: string }> = {
  spring: { bg: "#5A8F5C", hover: "#4d7a4f" },
  summer: { bg: "#D4912A", hover: "#bf8224" },
  fall: { bg: "#C4652A", hover: "#b05a25" },
  winter: { bg: "#5B7B9A", hover: "#4f6d89" },
};

interface GenerateButtonProps {
  householdId: string;
  season?: Season;
}

export function GenerateButton({ householdId, season }: GenerateButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colors = season ? seasonButtonColors[season] : undefined;

  async function handleGenerate() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to generate plan");
      }

      const data = await response.json();
      const planWeeks = data.planWeeks ?? 1;

      // Save first week
      await savePlan(data.householdId, data.plan, 0);

      // Generate and save additional weeks if multi-week planning
      for (let week = 1; week < planWeeks; week++) {
        const weekResponse = await fetch("/api/generate-plan", {
          method: "POST",
        });
        if (weekResponse.ok) {
          const weekData = await weekResponse.json();
          await savePlan(data.householdId, weekData.plan, week);
        }
      }

      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 animate-fade-up-delay-1">
      <Button
        onClick={handleGenerate}
        disabled={isLoading}
        className="group relative w-full overflow-hidden rounded-xl text-[15px] font-semibold shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
        size="lg"
        style={
          colors
            ? {
                backgroundColor: colors.bg,
                backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%)`,
              }
            : undefined
        }
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4.5 w-4.5 animate-spin" />
            <span>Generating your plan...</span>
          </>
        ) : (
          <>
            <Sparkles className="h-4.5 w-4.5 transition-transform duration-300 group-hover:rotate-12" />
            <span>Generate This Week</span>
          </>
        )}
      </Button>
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
    </div>
  );
}
