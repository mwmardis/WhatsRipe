"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Plus, Pencil, Trash2 } from "lucide-react";

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Children</CardTitle>
            <CardDescription>
              Add children to get age-appropriate food adaptations.
            </CardDescription>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
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
                <DialogTitle>Add Child</DialogTitle>
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="child-birthdate">Birthdate</Label>
                  <Input
                    id="child-birthdate"
                    type="date"
                    value={newBirthdate}
                    onChange={(e) => setNewBirthdate(e.target.value)}
                  />
                </div>
                {newBirthdate && (
                  <div className="text-sm text-muted-foreground">
                    Food stage:{" "}
                    <Badge variant="secondary">
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
                >
                  {submitting ? "Adding..." : "Add Child"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {children.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No children added yet. Add a child to get baby food adaptations in
            your meal plans.
          </p>
        ) : (
          <div className="space-y-3">
            {children.map((child) => {
              const birthdate = new Date(child.birthdate);
              const stage = getFoodStage(birthdate);
              return (
                <div
                  key={child.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{child.name}</span>
                      <span className="text-sm text-muted-foreground">
                        ({formatAge(birthdate)})
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {getFoodStageLabel(stage)}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(child)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(child.id)}
                      disabled={submitting}
                    >
                      <Trash2 className="h-4 w-4" />
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
              <DialogTitle>Edit Child</DialogTitle>
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-child-birthdate">Birthdate</Label>
                <Input
                  id="edit-child-birthdate"
                  type="date"
                  value={newBirthdate}
                  onChange={(e) => setNewBirthdate(e.target.value)}
                />
              </div>
              {newBirthdate && (
                <div className="text-sm text-muted-foreground">
                  Food stage:{" "}
                  <Badge variant="secondary">
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
              >
                {submitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
