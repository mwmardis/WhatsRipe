"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Plus, Check, AlertTriangle, ShieldAlert, Baby } from "lucide-react";
import { addAllergenLog, removeAllergenLog } from "@/app/actions/allergen-actions";

const COMMON_ALLERGENS = [
  { key: "peanuts", label: "Peanuts", emoji: "\uD83E\uDD5C" },
  { key: "tree_nuts", label: "Tree Nuts", emoji: "\uD83C\uDF30" },
  { key: "milk", label: "Milk", emoji: "\uD83E\uDD5B" },
  { key: "eggs", label: "Eggs", emoji: "\uD83E\uDD5A" },
  { key: "wheat", label: "Wheat", emoji: "\uD83C\uDF3E" },
  { key: "soy", label: "Soy", emoji: "\uD83C\uDF31" },
  { key: "fish", label: "Fish", emoji: "\uD83D\uDC1F" },
  { key: "shellfish", label: "Shellfish", emoji: "\uD83E\uDD90" },
  { key: "sesame", label: "Sesame", emoji: "\uD83C\uDF6A" },
];

type Reaction = "none" | "mild" | "moderate" | "severe";

interface AllergenLog {
  id: string;
  allergen: string;
  introducedAt: Date | string;
  reaction: string;
  notes: string | null;
  childId: string;
  createdAt: Date | string;
}

interface ChildWithLogs {
  id: string;
  name: string;
  birthdate: Date | string;
  allergies: string;
  feedingApproach: string;
  householdId: string;
  allergenLogs: AllergenLog[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

const REACTION_CONFIG: Record<
  Reaction,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  none: {
    label: "No Reaction",
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-800/50",
  },
  mild: {
    label: "Mild",
    color: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800/50",
  },
  moderate: {
    label: "Moderate",
    color: "text-orange-700 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    borderColor: "border-orange-200 dark:border-orange-800/50",
  },
  severe: {
    label: "Severe",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-800/50",
  },
};

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getReactionIcon(reaction: string) {
  switch (reaction) {
    case "none":
      return <Check className="h-3.5 w-3.5" />;
    case "mild":
      return <AlertTriangle className="h-3.5 w-3.5" />;
    case "moderate":
      return <AlertTriangle className="h-3.5 w-3.5" />;
    case "severe":
      return <ShieldAlert className="h-3.5 w-3.5" />;
    default:
      return null;
  }
}

export function AllergenTrackerView({
  initialChildren,
}: {
  initialChildren: ChildWithLogs[];
}) {
  const [children, setChildren] = useState<ChildWithLogs[]>(initialChildren);

  if (children.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border/60 bg-card/50 p-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(196,101,42,0.08)]">
          <Baby className="h-7 w-7 text-primary/60" />
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-[280px]">
          Add children in Settings to start tracking allergens.
        </p>
      </div>
    );
  }

  if (children.length === 1) {
    return (
      <ChildAllergenPanel
        child={children[0]}
        onUpdate={(updated) =>
          setChildren((prev) =>
            prev.map((c) => (c.id === updated.id ? updated : c))
          )
        }
      />
    );
  }

  return (
    <Tabs defaultValue={children[0].id}>
      <TabsList className="w-full">
        {children.map((child) => (
          <TabsTrigger key={child.id} value={child.id} className="flex-1">
            {child.name}
          </TabsTrigger>
        ))}
      </TabsList>
      {children.map((child) => (
        <TabsContent key={child.id} value={child.id}>
          <ChildAllergenPanel
            child={child}
            onUpdate={(updated) =>
              setChildren((prev) =>
                prev.map((c) => (c.id === updated.id ? updated : c))
              )
            }
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function ChildAllergenPanel({
  child,
  onUpdate,
}: {
  child: ChildWithLogs;
  onUpdate: (child: ChildWithLogs) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAllergen, setSelectedAllergen] = useState("");
  const [introducedDate, setIntroducedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [reaction, setReaction] = useState<Reaction>("none");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const logsByAllergen = new Map<string, AllergenLog>();
  for (const log of child.allergenLogs) {
    if (!logsByAllergen.has(log.allergen)) {
      logsByAllergen.set(log.allergen, log);
    }
  }

  const introducedCount = COMMON_ALLERGENS.filter((a) =>
    logsByAllergen.has(a.key)
  ).length;

  const handleAdd = async () => {
    if (!selectedAllergen || !introducedDate) return;
    setSubmitting(true);
    try {
      const log = await addAllergenLog({
        childId: child.id,
        allergen: selectedAllergen,
        introducedAt: introducedDate,
        reaction,
        notes: notes.trim() || undefined,
      });
      onUpdate({
        ...child,
        allergenLogs: [log, ...child.allergenLogs],
      });
      setSelectedAllergen("");
      setIntroducedDate(new Date().toISOString().split("T")[0]);
      setReaction("none");
      setNotes("");
      setDialogOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (logId: string) => {
    setRemoving(logId);
    try {
      await removeAllergenLog(logId);
      onUpdate({
        ...child,
        allergenLogs: child.allergenLogs.filter((l) => l.id !== logId),
      });
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="flex flex-col gap-5 mt-4">
      {/* Progress summary */}
      <div className="rounded-xl border border-border/60 bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-display text-sm font-semibold tracking-tight">
              Introduction Progress
            </h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {introducedCount} of {COMMON_ALLERGENS.length} FDA top allergens
              introduced
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="rounded-lg"
                onClick={() => {
                  setSelectedAllergen("");
                  setIntroducedDate(new Date().toISOString().split("T")[0]);
                  setReaction("none");
                  setNotes("");
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Log Introduction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">
                  Log Allergen Introduction
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <Label>Allergen</Label>
                  <Select
                    value={selectedAllergen}
                    onValueChange={setSelectedAllergen}
                  >
                    <SelectTrigger className="w-full rounded-lg">
                      <SelectValue placeholder="Select an allergen" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_ALLERGENS.map((a) => (
                        <SelectItem key={a.key} value={a.key}>
                          <span className="flex items-center gap-2">
                            <span>{a.emoji}</span>
                            <span>{a.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="intro-date">Date Introduced</Label>
                  <Input
                    id="intro-date"
                    type="date"
                    value={introducedDate}
                    onChange={(e) => setIntroducedDate(e.target.value)}
                    className="rounded-lg"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Reaction Level</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      ["none", "mild", "moderate", "severe"] as const
                    ).map((level) => {
                      const config = REACTION_CONFIG[level];
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setReaction(level)}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors ${
                            reaction === level
                              ? `${config.borderColor} ${config.bgColor} ${config.color}`
                              : "border-border hover:bg-muted/50"
                          }`}
                        >
                          {getReactionIcon(level)}
                          <span>{config.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="intro-notes">
                    Notes{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="intro-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., mixed into oatmeal, small amount"
                    className="rounded-lg"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleAdd}
                  disabled={submitting || !selectedAllergen || !introducedDate}
                  className="rounded-lg"
                >
                  {submitting ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary/70 transition-all duration-500"
            style={{
              width: `${(introducedCount / COMMON_ALLERGENS.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Allergen grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {COMMON_ALLERGENS.map((allergen) => {
          const log = logsByAllergen.get(allergen.key);
          const isIntroduced = !!log;
          const reactionLevel = (log?.reaction as Reaction) || "none";
          const config = isIntroduced
            ? REACTION_CONFIG[reactionLevel]
            : null;

          return (
            <div
              key={allergen.key}
              className={`relative flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-colors ${
                isIntroduced
                  ? `${config!.borderColor} ${config!.bgColor}`
                  : "border-border/60 bg-card opacity-60"
              }`}
            >
              {isIntroduced && (
                <div
                  className={`absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full ${
                    reactionLevel === "none"
                      ? "bg-green-500"
                      : reactionLevel === "mild"
                        ? "bg-amber-500"
                        : reactionLevel === "moderate"
                          ? "bg-orange-500"
                          : "bg-red-500"
                  }`}
                >
                  <Check className="h-2.5 w-2.5 text-white" />
                </div>
              )}
              <span className="text-xl leading-none">{allergen.emoji}</span>
              <span className="text-[11px] font-medium text-center leading-tight">
                {allergen.label}
              </span>
              {isIntroduced && log ? (
                <span
                  className={`text-[10px] ${config!.color} font-medium`}
                >
                  {formatDate(log.introducedAt)}
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground">
                  Not yet
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Timeline of introductions */}
      {child.allergenLogs.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card">
          <div className="p-4 pb-2">
            <h3 className="font-display text-sm font-semibold tracking-tight">
              Introduction Timeline
            </h3>
          </div>
          <div className="px-4 pb-3">
            <div className="flex flex-col gap-2">
              {child.allergenLogs.map((log, index) => {
                const allergenInfo = COMMON_ALLERGENS.find(
                  (a) => a.key === log.allergen
                );
                const reactionLevel = (log.reaction as Reaction) || "none";
                const config = REACTION_CONFIG[reactionLevel];
                const label = allergenInfo?.label || log.allergen;
                const emoji = allergenInfo?.emoji || "";

                return (
                  <div
                    key={log.id}
                    className="group flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/30"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center pt-0.5">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full ${config.bgColor} ${config.borderColor} border`}
                      >
                        <span className="text-xs leading-none">{emoji}</span>
                      </div>
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{label}</span>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] rounded-full border ${config.bgColor} ${config.color} ${config.borderColor}`}
                        >
                          {getReactionIcon(reactionLevel)}
                          <span className="ml-0.5">{config.label}</span>
                        </Badge>
                      </div>
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        {formatDate(log.introducedAt)}
                      </p>
                      {log.notes && (
                        <p className="text-[12px] text-muted-foreground/80 mt-1 italic">
                          {log.notes}
                        </p>
                      )}
                    </div>
                    {/* Remove button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemove(log.id)}
                      disabled={removing === log.id}
                    >
                      <span className="text-xs">
                        {removing === log.id ? "..." : "\u00D7"}
                      </span>
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
