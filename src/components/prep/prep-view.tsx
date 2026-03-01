"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  Clock,
  ChefHat,
  Refrigerator,
  Timer,
  Info,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  generatePrepSchedule,
  type PrepSchedule,
} from "@/app/actions/prep-actions";

function formatTotalTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

function PrepSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2.5 py-2">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground font-medium">
          Planning your prep day...
        </span>
      </div>
      <Skeleton className="h-8 w-40 rounded-full" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <Skeleton className="h-4 w-3/4 rounded-md" />
              <Skeleton className="h-3 w-1/2 rounded-md" />
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  );
}

function TaskItem({
  task,
  index,
  checked,
  onToggle,
}: {
  task: PrepSchedule["tasks"][number];
  index: number;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`flex gap-3 transition-opacity duration-200 ${checked ? "opacity-50" : ""}`}
    >
      {/* Time circle */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold">
          {task.startTime}
        </div>
        {/* Vertical connector line */}
        <div className="w-px flex-1 bg-border/60" />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5 pb-5 flex-1 min-w-0">
        <div className="flex items-start gap-2.5">
          <Checkbox
            checked={checked}
            onCheckedChange={onToggle}
            className="mt-0.5"
          />
          <div className="flex flex-col gap-1 min-w-0">
            <p
              className={`text-sm font-medium leading-snug ${checked ? "line-through text-muted-foreground" : "text-foreground"}`}
            >
              {task.task}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="secondary"
                className="rounded-full px-2 py-0 text-[10px] font-medium"
              >
                <Timer className="h-2.5 w-2.5 mr-0.5" />
                {task.duration}min
              </Badge>
              <span className="text-xs text-muted-foreground">
                {task.forMeal}
              </span>
            </div>
          </div>
        </div>

        {task.tip && (
          <div className="ml-7 mt-1 flex items-start gap-1.5 rounded-lg bg-primary/5 border border-primary/10 px-2.5 py-1.5">
            <Info className="h-3 w-3 text-primary/60 mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              {task.tip}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StorageCard({
  item,
}: {
  item: PrepSchedule["storageInstructions"][number];
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-3.5">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
          <Refrigerator className="h-4 w-4 text-primary" />
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{item.meal}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {item.instruction}
          </p>
          <Badge
            variant="outline"
            className="rounded-full px-2 py-0 text-[10px] mt-0.5 w-fit"
          >
            Keeps {item.keepDays} {item.keepDays === 1 ? "day" : "days"}
          </Badge>
        </div>
      </div>
    </div>
  );
}

export function PrepView({
  weeklyPlanId,
}: {
  weeklyPlanId: string | null;
}) {
  const [schedule, setSchedule] = useState<PrepSchedule | null>(null);
  const [generating, setGenerating] = useState(false);
  const [checkedTasks, setCheckedTasks] = useState<Set<number>>(new Set());

  function toggleTask(index: number) {
    setCheckedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  async function handleGenerate() {
    if (!weeklyPlanId) return;
    setGenerating(true);
    setCheckedTasks(new Set());
    try {
      const result = await generatePrepSchedule(weeklyPlanId);
      setSchedule(result);
    } catch {
      toast.error("Failed to generate prep schedule. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  // No weekly plan at all
  if (!weeklyPlanId) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border/60 bg-card/50 p-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <ChefHat className="size-7 text-muted-foreground/60" />
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-[260px]">
          Generate a meal plan first to create your prep schedule.
        </p>
      </div>
    );
  }

  // Loading state
  if (generating) {
    return <PrepSkeleton />;
  }

  // Plan exists but no schedule yet
  if (!schedule) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 rounded-xl border-2 border-dashed border-primary/30 bg-secondary/30 p-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <ChefHat className="size-7 text-primary" />
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-[260px]">
          Your meal plan is ready. Generate a timed prep day schedule to batch
          cook for the week.
        </p>
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="rounded-xl shadow-sm"
        >
          <ChefHat className="size-4 mr-2" />
          Generate Prep Schedule
        </Button>
      </div>
    );
  }

  // Schedule is ready
  const completedCount = checkedTasks.size;
  const totalCount = schedule.tasks.length;

  return (
    <div className="flex flex-col gap-5">
      {/* Header with total time and progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className="rounded-full px-3 py-1 text-xs font-semibold">
            <Clock className="h-3 w-3 mr-1" />
            Total: {formatTotalTime(schedule.totalTime)}
          </Badge>
          {completedCount > 0 && (
            <Badge
              variant="secondary"
              className="rounded-full px-3 py-1 text-xs font-medium"
            >
              {completedCount}/{totalCount} done
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={generating}
          className="rounded-lg"
        >
          {generating ? (
            <>
              <Loader2 className="size-3.5 mr-1 animate-spin" />
              Regenerating...
            </>
          ) : (
            <>
              <RefreshCw className="size-3.5 mr-1" />
              Regenerate
            </>
          )}
        </Button>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{
              width: `${(completedCount / totalCount) * 100}%`,
            }}
          />
        </div>
      )}

      {/* Timeline of tasks */}
      <div className="rounded-xl border border-border/60 bg-card p-4">
        <h3 className="font-display text-base font-semibold mb-4 flex items-center gap-2">
          <Timer className="h-4 w-4 text-primary" />
          Prep Timeline
        </h3>
        <div className="flex flex-col">
          {schedule.tasks.map((task, i) => (
            <TaskItem
              key={i}
              task={task}
              index={i}
              checked={checkedTasks.has(i)}
              onToggle={() => toggleTask(i)}
            />
          ))}
        </div>
      </div>

      {/* Storage instructions */}
      {schedule.storageInstructions.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-display text-base font-semibold flex items-center gap-2">
            <Refrigerator className="h-4 w-4 text-primary" />
            Storage Instructions
          </h3>
          <div className="flex flex-col gap-2.5">
            {schedule.storageInstructions.map((item, i) => (
              <div
                key={i}
                className="animate-fade-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <StorageCard item={item} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
