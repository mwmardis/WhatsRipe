"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { addChild, updateChild, removeChild } from "@/app/settings/actions";
import { getFoodStage, getFoodStageLabel } from "@/lib/food-stages";
import { Plus, Pencil, Trash2, Baby } from "lucide-react";

interface Child {
  id: string;
  name: string;
  birthdate: Date | string;
  allergies: string;
}

interface ChildrenManagerProps {
  initialChildren: Child[];
}

function formatAge(birthdate: Date): string {
  const now = new Date();
  const months =
    (now.getFullYear() - birthdate.getFullYear()) * 12 +
    (now.getMonth() - birthdate.getMonth());
  if (months < 12) return `${months}mo`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) return `${years}y`;
  return `${years}y ${remainingMonths}mo`;
}

function toDateInputValue(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

export function ChildrenManager({ initialChildren }: ChildrenManagerProps) {
  const [children, setChildren] = useState<Child[]>(initialChildren);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [newName, setNewName] = useState("");
  const [newBirthdate, setNewBirthdate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!newName.trim() || !newBirthdate) return;
    setSubmitting(true);
    try {
      const child = await addChild({
        name: newName.trim(),
        birthdate: newBirthdate,
      });
      setChildren((prev) => [...prev, child]);
      setNewName("");
      setNewBirthdate("");
      setAddDialogOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editingChild || !newName.trim() || !newBirthdate) return;
    setSubmitting(true);
    try {
      const updated = await updateChild(editingChild.id, {
        name: newName.trim(),
        birthdate: newBirthdate,
        allergies: [],
      });
      setChildren((prev) =>
        prev.map((c) => (c.id === editingChild.id ? updated : c))
      );
      setEditingChild(null);
      setNewName("");
      setNewBirthdate("");
      setEditDialogOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    setSubmitting(true);
    try {
      await removeChild(id);
      setChildren((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (child: Child) => {
    setEditingChild(child);
    setNewName(child.name);
    setNewBirthdate(toDateInputValue(child.birthdate));
    setEditDialogOpen(true);
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card">
      <div className="p-5 pb-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Children
            </h2>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Add children to get age-appropriate food adaptations.
            </p>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="rounded-lg"
                onClick={() => {
                  setNewName("");
                  setNewBirthdate("");
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Child
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">Add Child</DialogTitle>
                <DialogDescription>
                  Enter your child&apos;s name and birthdate. The food stage
                  will be calculated automatically.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="child-name">Name</Label>
                  <Input
                    id="child-name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Child's name"
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="child-birthdate">Birthdate</Label>
                  <Input
                    id="child-birthdate"
                    type="date"
                    value={newBirthdate}
                    onChange={(e) => setNewBirthdate(e.target.value)}
                    className="rounded-lg"
                  />
                </div>
                {newBirthdate && (
                  <div className="text-sm text-muted-foreground">
                    Food stage:{" "}
                    <Badge variant="secondary" className="rounded-full">
                      {getFoodStageLabel(
                        getFoodStage(new Date(newBirthdate))
                      )}
                    </Badge>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  onClick={handleAdd}
                  disabled={submitting || !newName.trim() || !newBirthdate}
                  className="rounded-lg"
                >
                  {submitting ? "Adding..." : "Add Child"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="p-5">
        {children.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(196,101,42,0.08)]">
              <Baby className="h-5 w-5 text-primary/60" />
            </div>
            <p className="text-sm text-muted-foreground max-w-[220px]">
              No children added yet. Add a child to get baby food adaptations in
              your meal plans.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {children.map((child) => {
              const birthdate = new Date(child.birthdate);
              const stage = getFoodStage(birthdate);
              return (
                <div
                  key={child.id}
                  className="flex items-center justify-between rounded-xl border border-border/60 p-3.5 transition-colors hover:bg-muted/30"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{child.name}</span>
                      <span className="text-[13px] text-muted-foreground">
                        ({formatAge(birthdate)})
                      </span>
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-[11px] rounded-full bg-[rgba(196,101,42,0.08)] text-primary/80 border-0"
                    >
                      {getFoodStageLabel(stage)}
                    </Badge>
                  </div>
                  <div className="flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      onClick={() => openEditDialog(child)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemove(child.id)}
                      disabled={submitting}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Edit Child</DialogTitle>
              <DialogDescription>
                Update your child&apos;s information.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-child-name">Name</Label>
                <Input
                  id="edit-child-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Child's name"
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-child-birthdate">Birthdate</Label>
                <Input
                  id="edit-child-birthdate"
                  type="date"
                  value={newBirthdate}
                  onChange={(e) => setNewBirthdate(e.target.value)}
                  className="rounded-lg"
                />
              </div>
              {newBirthdate && (
                <div className="text-sm text-muted-foreground">
                  Food stage:{" "}
                  <Badge variant="secondary" className="rounded-full">
                    {getFoodStageLabel(
                      getFoodStage(new Date(newBirthdate))
                    )}
                  </Badge>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                onClick={handleEdit}
                disabled={submitting || !newName.trim() || !newBirthdate}
                className="rounded-lg"
              >
                {submitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
