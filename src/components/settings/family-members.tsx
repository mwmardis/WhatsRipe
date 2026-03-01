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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addFamilyMember,
  updateFamilyMember,
  removeFamilyMember,
} from "@/app/actions/family-actions";
import { Plus, Pencil, Trash2, Users } from "lucide-react";

interface FamilyMember {
  id: string;
  name: string;
  email: string | null;
  role: string;
}

interface FamilyMembersProps {
  initialMembers: FamilyMember[];
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: "Can edit plans and settings",
  member: "Can view and check off groceries",
  viewer: "View only access",
};

const ROLE_BADGE_STYLES: Record<string, string> = {
  admin:
    "bg-primary/10 text-primary/90 border-0",
  member:
    "bg-[rgba(196,101,42,0.08)] text-primary/80 border-0",
  viewer:
    "bg-muted text-muted-foreground border-0",
};

export function FamilyMembers({ initialMembers }: FamilyMembersProps) {
  const [members, setMembers] = useState<FamilyMember[]>(initialMembers);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("member");
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setNewName("");
    setNewEmail("");
    setNewRole("member");
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSubmitting(true);
    try {
      const member = await addFamilyMember({
        name: newName.trim(),
        email: newEmail.trim() || undefined,
        role: newRole,
      });
      setMembers((prev) => [...prev, member]);
      resetForm();
      setAddDialogOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editingMember || !newName.trim()) return;
    setSubmitting(true);
    try {
      const updated = await updateFamilyMember(editingMember.id, {
        name: newName.trim(),
        email: newEmail.trim() || undefined,
        role: newRole,
      });
      setMembers((prev) =>
        prev.map((m) => (m.id === editingMember.id ? updated : m))
      );
      setEditingMember(null);
      resetForm();
      setEditDialogOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    setSubmitting(true);
    try {
      await removeFamilyMember(id);
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (member: FamilyMember) => {
    setEditingMember(member);
    setNewName(member.name);
    setNewEmail(member.email || "");
    setNewRole(member.role);
    setEditDialogOpen(true);
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card">
      <div className="p-5 pb-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Family Members
            </h2>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Share your meal plan with family
            </p>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="rounded-lg"
                onClick={() => resetForm()}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">
                  Add Family Member
                </DialogTitle>
                <DialogDescription>
                  Add a family member to share your meal plan. Choose their
                  access level with a role.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="member-name">Name</Label>
                  <Input
                    id="member-name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Family member's name"
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member-email">
                    Email{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="member-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member-role">Role</Label>
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger className="w-full rounded-lg">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    {ROLE_DESCRIPTIONS[newRole]}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleAdd}
                  disabled={submitting || !newName.trim()}
                  className="rounded-lg"
                >
                  {submitting ? "Adding..." : "Add Member"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="p-5">
        {members.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(196,101,42,0.08)]">
              <Users className="h-5 w-5 text-primary/60" />
            </div>
            <p className="text-sm text-muted-foreground max-w-[220px]">
              Add family members to share your meal plan
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-xl border border-border/60 p-3.5 transition-colors hover:bg-muted/30"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{member.name}</span>
                    <Badge
                      variant="secondary"
                      className={`text-[11px] rounded-full ${ROLE_BADGE_STYLES[member.role] || ROLE_BADGE_STYLES.member}`}
                    >
                      {ROLE_LABELS[member.role] || member.role}
                    </Badge>
                  </div>
                  {member.email && (
                    <p className="text-[13px] text-muted-foreground">
                      {member.email}
                    </p>
                  )}
                </div>
                <div className="flex gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    onClick={() => openEditDialog(member)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(member.id)}
                    disabled={submitting}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">
                Edit Family Member
              </DialogTitle>
              <DialogDescription>
                Update this family member&apos;s information and access level.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-member-name">Name</Label>
                <Input
                  id="edit-member-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Family member's name"
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-member-email">
                  Email{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="edit-member-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-member-role">Role</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="w-full rounded-lg">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  {ROLE_DESCRIPTIONS[newRole]}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleEdit}
                disabled={submitting || !newName.trim()}
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
