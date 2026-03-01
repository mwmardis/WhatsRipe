"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Package,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  addPantryItem,
  updatePantryItem,
  removePantryItem,
  clearExpiredItems,
} from "@/app/actions/pantry-actions";
import { toast } from "sonner";

interface PantryItemData {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiresAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

const CATEGORIES = [
  { value: "produce", label: "Produce", emoji: "\u{1F96C}" },
  { value: "dairy", label: "Dairy", emoji: "\u{1F9C0}" },
  { value: "meat", label: "Meat", emoji: "\u{1F969}" },
  { value: "pantry", label: "Pantry", emoji: "\u{1FAD9}" },
  { value: "frozen", label: "Frozen", emoji: "\u{1F9CA}" },
  { value: "spice", label: "Spice", emoji: "\u{1F336}\u{FE0F}" },
];

const CATEGORY_ORDER = ["produce", "dairy", "meat", "pantry", "frozen", "spice"];

function getCategoryConfig(category: string) {
  return (
    CATEGORIES.find((c) => c.value === category) ?? {
      value: category,
      label: category,
      emoji: "\u{1F4E6}",
    }
  );
}

function getExpirationStatus(expiresAt: Date | string | null): "ok" | "warning" | "expired" {
  if (!expiresAt) return "ok";
  const now = new Date();
  const expDate = new Date(expiresAt);
  if (expDate < now) return "expired";
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
  if (expDate.getTime() - now.getTime() < threeDaysMs) return "warning";
  return "ok";
}

function formatExpirationLabel(expiresAt: Date | string | null): string | null {
  if (!expiresAt) return null;
  const expDate = new Date(expiresAt);
  const now = new Date();
  const diffMs = expDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `Expired ${Math.abs(diffDays)}d ago`;
  if (diffDays === 0) return "Expires today";
  if (diffDays === 1) return "Expires tomorrow";
  if (diffDays <= 7) return `Expires in ${diffDays}d`;
  return `Exp. ${expDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

function toDateInputValue(date: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ─── Add / Edit Dialog ──────────────────────────────────────────────

function PantryItemDialog({
  mode,
  item,
  trigger,
  onSaved,
}: {
  mode: "add" | "edit";
  item?: PantryItemData;
  trigger: React.ReactNode;
  onSaved?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(item?.name ?? "");
  const [quantity, setQuantity] = useState(String(item?.quantity ?? 1));
  const [unit, setUnit] = useState(item?.unit ?? "count");
  const [category, setCategory] = useState(item?.category ?? "pantry");
  const [expiresAt, setExpiresAt] = useState(toDateInputValue(item?.expiresAt ?? null));
  const [loading, setLoading] = useState(false);

  function resetForm() {
    if (mode === "add") {
      setName("");
      setQuantity("1");
      setUnit("count");
      setCategory("pantry");
      setExpiresAt("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    try {
      if (mode === "add") {
        await addPantryItem({
          name: name.trim(),
          quantity: parseFloat(quantity) || 1,
          unit: unit.trim() || "count",
          category,
          expiresAt: expiresAt || undefined,
        });
        toast.success(`Added ${name.trim()}`);
      } else if (item) {
        await updatePantryItem(item.id, {
          name: name.trim(),
          quantity: parseFloat(quantity) || 1,
          unit: unit.trim() || "count",
          category,
          expiresAt: expiresAt || null,
        });
        toast.success(`Updated ${name.trim()}`);
      }
      resetForm();
      setOpen(false);
      onSaved?.();
    } catch {
      toast.error(mode === "add" ? "Failed to add item" : "Failed to update item");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next && item) {
          setName(item.name);
          setQuantity(String(item.quantity));
          setUnit(item.unit);
          setCategory(item.category);
          setExpiresAt(toDateInputValue(item.expiresAt));
        }
        if (!next && mode === "add") {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">
            {mode === "add" ? "Add Pantry Item" : "Edit Pantry Item"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="pantry-name">Name</Label>
            <Input
              id="pantry-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Olive Oil"
              required
              className="rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="pantry-quantity">Quantity</Label>
              <Input
                id="pantry-quantity"
                type="number"
                min="0.1"
                step="0.1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="rounded-lg"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="pantry-unit">Unit</Label>
              <Input
                id="pantry-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g., lb, oz, count"
                className="rounded-lg"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.emoji} {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="pantry-expires">
              Expiration Date{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="pantry-expires"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="rounded-lg"
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !name.trim()}
            className="rounded-xl"
          >
            {loading
              ? mode === "add"
                ? "Adding..."
                : "Saving..."
              : mode === "add"
                ? "Add"
                : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Category Section ───────────────────────────────────────────────

function PantrySection({
  category,
  items,
  onItemRemoved,
}: {
  category: string;
  items: PantryItemData[];
  onItemRemoved?: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const config = getCategoryConfig(category);
  const count = items.length;

  const expiredCount = items.filter(
    (i) => getExpirationStatus(i.expiresAt) === "expired"
  ).length;
  const warningCount = items.filter(
    (i) => getExpirationStatus(i.expiresAt) === "warning"
  ).length;

  async function handleRemove(id: string, itemName: string) {
    setRemovingId(id);
    try {
      await removePantryItem(id);
      toast.success(`Removed ${itemName}`);
      onItemRemoved?.();
    } catch {
      toast.error("Failed to remove item");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between p-3.5 text-left hover:bg-muted/30 transition-colors duration-150"
      >
        <div className="flex items-center gap-2.5">
          {collapsed ? (
            <ChevronRight className="size-4 text-muted-foreground/60" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground/60" />
          )}
          <span className="text-sm">{config.emoji}</span>
          <span className="font-semibold text-[15px]">{config.label}</span>
          <span className="text-xs text-muted-foreground rounded-full bg-muted px-2 py-0.5">
            {count}
          </span>
          {expiredCount > 0 && (
            <Badge
              variant="destructive"
              className="text-[10px] px-1.5 py-0"
            >
              {expiredCount} expired
            </Badge>
          )}
          {warningCount > 0 && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 border-amber-400/60 text-amber-600 dark:text-amber-400"
            >
              {warningCount} expiring
            </Badge>
          )}
        </div>
      </button>

      {!collapsed && (
        <ul className="divide-y divide-border/40 border-t border-border/40">
          {items.map((item) => {
            const status = getExpirationStatus(item.expiresAt);
            const expirationLabel = formatExpirationLabel(item.expiresAt);

            return (
              <li
                key={item.id}
                className={`flex items-center gap-3 px-4 py-3 transition-colors duration-150 ${
                  status === "expired"
                    ? "bg-red-50/60 dark:bg-red-950/20"
                    : status === "warning"
                      ? "bg-amber-50/60 dark:bg-amber-950/20"
                      : ""
                }`}
              >
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <span className="text-[15px] text-foreground truncate">
                    {item.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">
                      {item.quantity} {item.unit}
                    </span>
                    {expirationLabel && (
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                          status === "expired"
                            ? "text-red-600 dark:text-red-400"
                            : status === "warning"
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-muted-foreground"
                        }`}
                      >
                        {(status === "expired" || status === "warning") && (
                          <AlertTriangle className="size-3" />
                        )}
                        {expirationLabel}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <PantryItemDialog
                    mode="edit"
                    item={item}
                    trigger={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-8 p-0 rounded-lg"
                      >
                        <Pencil className="size-3.5 text-muted-foreground" />
                      </Button>
                    }
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-8 p-0 rounded-lg"
                    disabled={removingId === item.id}
                    onClick={() => handleRemove(item.id, item.name)}
                  >
                    <Trash2 className="size-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─── Main Pantry View ───────────────────────────────────────────────

export function PantryView({
  initialItems,
}: {
  initialItems: PantryItemData[];
}) {
  const [clearing, startClearTransition] = useTransition();

  // Group items by category
  const grouped: Record<string, PantryItemData[]> = {};
  for (const item of initialItems) {
    if (!grouped[item.category]) {
      grouped[item.category] = [];
    }
    grouped[item.category].push(item);
  }

  const orderedSections = CATEGORY_ORDER.filter((c) => grouped[c]?.length);

  // Also include any categories not in our predefined order
  const extraSections = Object.keys(grouped).filter(
    (c) => !CATEGORY_ORDER.includes(c)
  );
  const allSections = [...orderedSections, ...extraSections];

  const hasExpired = initialItems.some(
    (item) => getExpirationStatus(item.expiresAt) === "expired"
  );
  const totalItems = initialItems.length;

  // Empty state
  if (totalItems === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <PantryItemDialog
            mode="add"
            trigger={
              <Button variant="outline" size="sm" className="rounded-lg">
                <Plus className="size-4 mr-1" />
                Add Item
              </Button>
            }
          />
        </div>
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border/60 bg-card/50 p-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Package className="size-7 text-muted-foreground/60" />
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-[260px]">
            Your pantry is empty. Add items to keep track of what you have on
            hand and reduce food waste.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <PantryItemDialog
          mode="add"
          trigger={
            <Button variant="outline" size="sm" className="rounded-lg">
              <Plus className="size-4 mr-1" />
              Add Item
            </Button>
          }
        />

        {hasExpired && (
          <Button
            variant="outline"
            size="sm"
            disabled={clearing}
            className="rounded-lg"
            onClick={() => {
              startClearTransition(async () => {
                await clearExpiredItems();
                toast.success("Expired items cleared");
              });
            }}
          >
            <Trash2 className="size-3.5 mr-1" />
            {clearing ? "Clearing..." : "Clear Expired"}
          </Button>
        )}

        <span className="ml-auto text-xs text-muted-foreground">
          {totalItems} {totalItems === 1 ? "item" : "items"}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {allSections.map((category, i) => (
          <div
            key={category}
            className="animate-fade-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <PantrySection
              category={category}
              items={grouped[category]}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
