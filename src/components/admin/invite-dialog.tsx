"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("InviteDialog");
  const tc = useTranslations("Common");
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
        <Button>{t("generateInvite")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("generateInvite")}</DialogTitle>
        </DialogHeader>
        {link ? (
          <div className="space-y-2">
            <Label>{t("shareLink")}</Label>
            <Input
              value={link}
              readOnly
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button
              variant="outline"
              onClick={() => navigator.clipboard.writeText(link)}
            >
              {t("copy")}
            </Button>
          </div>
        ) : (
          <form action={handleCreate} className="space-y-3">
            <div>
              <Label>{tc("role")}</Label>
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
              <Label>{t("expiresInDays")}</Label>
              <Input
                name="expiresInDays"
                type="number"
                defaultValue={7}
                min={1}
                max={30}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? t("generating") : t("generate")}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
