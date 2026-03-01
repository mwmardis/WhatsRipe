"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Meh, ThumbsDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { rateMeal } from "@/app/actions/rating-actions";
import { cn } from "@/lib/utils";

interface MealRatingProps {
  mealId: string;
  mealName: string;
  initialRating?: { rating: string; notes: string | null } | null;
}

const ratingOptions = [
  {
    value: "loved",
    label: "Kids Loved It",
    icon: Heart,
    activeClasses: "bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-700 dark:text-emerald-300",
    iconActiveClasses: "fill-emerald-500 text-emerald-500 dark:fill-emerald-400 dark:text-emerald-400",
  },
  {
    value: "ok",
    label: "It Was OK",
    icon: Meh,
    activeClasses: "bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-900/40 dark:border-amber-700 dark:text-amber-300",
    iconActiveClasses: "text-amber-500 dark:text-amber-400",
  },
  {
    value: "refused",
    label: "Kids Refused",
    icon: ThumbsDown,
    activeClasses: "bg-red-100 border-red-300 text-red-700 dark:bg-red-900/40 dark:border-red-700 dark:text-red-300",
    iconActiveClasses: "text-red-500 dark:text-red-400",
  },
] as const;

export function MealRating({
  mealId,
  mealName,
  initialRating,
}: MealRatingProps) {
  const [selectedRating, setSelectedRating] = useState<string | null>(
    initialRating?.rating ?? null
  );
  const [notes, setNotes] = useState(initialRating?.notes ?? "");
  const [showNotes, setShowNotes] = useState(!!initialRating?.rating);
  const [isPending, startTransition] = useTransition();
  const [savedRating, setSavedRating] = useState<string | null>(
    initialRating?.rating ?? null
  );

  function handleRate(value: string) {
    // Optimistic update
    setSelectedRating(value);
    setShowNotes(true);

    startTransition(async () => {
      try {
        await rateMeal({
          mealId,
          mealName,
          rating: value,
          notes: notes || undefined,
        });
        setSavedRating(value);
        toast.success("Feedback saved!");
      } catch (err) {
        // Revert on error
        setSelectedRating(savedRating);
        const message =
          err instanceof Error ? err.message : "Failed to save feedback";
        toast.error(message);
      }
    });
  }

  function handleSaveNotes() {
    if (!selectedRating) return;

    startTransition(async () => {
      try {
        await rateMeal({
          mealId,
          mealName,
          rating: selectedRating,
          notes: notes || undefined,
        });
        setSavedRating(selectedRating);
        toast.success("Notes saved!");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to save notes";
        toast.error(message);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Section header */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(196,101,42,0.08)]">
          <Heart className="h-4.5 w-4.5 text-primary/70" />
        </div>
        <h2 className="font-display text-lg font-semibold">Family Feedback</h2>
        {isPending && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-auto" />
        )}
      </div>

      {/* Rating buttons */}
      <div className="rounded-xl border border-border/60 bg-card p-4">
        <div className="grid grid-cols-3 gap-2">
          {ratingOptions.map((option) => {
            const Icon = option.icon;
            const isActive = selectedRating === option.value;

            return (
              <Button
                key={option.value}
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => handleRate(option.value)}
                className={cn(
                  "flex h-auto flex-col gap-1.5 rounded-xl px-2 py-3 text-xs font-medium transition-all",
                  isActive && option.activeClasses
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isActive
                      ? option.iconActiveClasses
                      : "text-muted-foreground"
                  )}
                />
                <span className="leading-tight">{option.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Notes input */}
        {showNotes && (
          <div className="mt-4 flex flex-col gap-2">
            <label
              htmlFor="rating-notes"
              className="text-xs font-medium text-muted-foreground"
            >
              Add a note (optional)
            </label>
            <div className="flex gap-2">
              <Input
                id="rating-notes"
                placeholder="e.g. Loved the sauce but not the veggies"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="rounded-lg text-sm"
                disabled={isPending}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSaveNotes();
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleSaveNotes}
                disabled={isPending || !selectedRating}
                className="shrink-0 rounded-lg"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
