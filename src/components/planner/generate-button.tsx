"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { savePlan } from "@/app/actions/plan-actions";
import type { Season } from "@/data/seasonal-ingredients";

const seasonButtonColors: Record<Season, string> = {
  spring: "#16a34a",
  summer: "#d97706",
  fall: "#ea580c",
  winter: "#2563eb",
};

interface GenerateButtonProps {
  householdId: string;
  season?: Season;
}

export function GenerateButton({ householdId, season }: GenerateButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      await savePlan(data.householdId, data.plan);
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
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleGenerate}
        disabled={isLoading}
        className="w-full"
        size="lg"
        style={
          season
            ? { backgroundColor: seasonButtonColors[season] }
            : undefined
        }
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate This Week
          </>
        )}
      </Button>
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
    </div>
  );
}
