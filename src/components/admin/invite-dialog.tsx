"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createInviteLink } from "@/lib/actions/invites";

export function InviteDialog() {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate(formData: FormData) {
    setLoading(true);
    try {
      const invite = await createInviteLink({
        role: formData.get("role") as "MEMBER" | "VIEWER",
        expiresInDays: Number(formData.get("expiresInDays")),
      });
      const url = `${window.location.origin}/sign-up/${invite.token}`;
      setLink(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setLink(null);
      }}
    >
      <DialogTrigger asChild>
        <Button>Generate Invite Link</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Invite Link</DialogTitle>
        </DialogHeader>
        {link ? (
          <div className="space-y-2">
            <Label>Share this link:</Label>
            <Input
              value={link}
              readOnly
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button
              variant="outline"
              onClick={() => navigator.clipboard.writeText(link)}
            >
              Copy
            </Button>
          </div>
        ) : (
          <form action={handleCreate} className="space-y-3">
            <div>
              <Label>Role</Label>
              <Select name="role" defaultValue="MEMBER">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Expires in (days)</Label>
              <Input
                name="expiresInDays"
                type="number"
                defaultValue={7}
                min={1}
                max={30}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Generating..." : "Generate"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
