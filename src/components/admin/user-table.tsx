"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";
import { changeUserRole, removeUser, getUserActiveBookingCount, impersonateUser } from "@/lib/actions/users";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  createdAt: Date;
};

export function UserTable({
  users,
  currentUserId,
}: {
  users: User[];
  currentUserId: string;
}) {
  const router = useRouter();
  const t = useTranslations("AdminUsers");
  const tc = useTranslations("Common");
  const [loading, setLoading] = useState<string | null>(null);
  const [removeDialog, setRemoveDialog] = useState<{
    open: boolean;
    user: User | null;
    bookingCount: number;
  }>({ open: false, user: null, bookingCount: 0 });

  async function handleRoleChange(userId: string, role: Role) {
    setLoading(userId);
    try {
      const result = await changeUserRole(userId, role);
      if (result && "error" in result) return;
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function openRemoveDialog(user: User) {
    setLoading(user.id);
    try {
      const count = await getUserActiveBookingCount(user.id);
      setRemoveDialog({ open: true, user, bookingCount: count });
    } finally {
      setLoading(null);
    }
  }

  async function confirmRemove() {
    if (!removeDialog.user) return;
    setLoading(removeDialog.user.id);
    try {
      const result = await removeUser(removeDialog.user.id);
      if (result && "error" in result) return;
      setRemoveDialog({ open: false, user: null, bookingCount: 0 });
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <div className="space-y-3">
        {users.map((user) => (
          <div key={user.id} className="rounded-lg border p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium truncate">{user.name ?? "\u2014"}</p>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              </div>
              {user.id === currentUserId ? (
                <Badge className="shrink-0">{user.role}</Badge>
              ) : (
                <Select
                  defaultValue={user.role}
                  onValueChange={(v) => handleRoleChange(user.id, v as Role)}
                  disabled={loading === user.id}
                >
                  <SelectTrigger className="w-28 shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="VIEWER">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            {user.id !== currentUserId && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={async () => {
                    setLoading(user.id);
                    try {
                      const result = await impersonateUser(user.id);
                      if (result && "error" in result) return;
                      window.location.href = "/";
                    } finally {
                      setLoading(null);
                    }
                  }}
                  disabled={loading === user.id}
                >
                  {t("impersonate")}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={() => openRemoveDialog(user)}
                  disabled={loading === user.id}
                >
                  {t("remove")}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog
        open={removeDialog.open}
        onOpenChange={(open) => {
          if (!open) setRemoveDialog({ open: false, user: null, bookingCount: 0 });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("confirmRemoveTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm">
              {t("confirmRemoveMessage", { name: removeDialog.user?.name ?? removeDialog.user?.email ?? "" })}
            </p>
            {removeDialog.bookingCount > 0 && (
              <div className="flex items-start gap-2 rounded-md bg-yellow-500/10 p-3 text-yellow-600 dark:text-yellow-500">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <p className="text-sm">
                  {t("hasActiveBookings", { count: removeDialog.bookingCount })}
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setRemoveDialog({ open: false, user: null, bookingCount: 0 })}
              >
                {tc("cancel")}
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={confirmRemove}
                disabled={loading === removeDialog.user?.id}
              >
                {t("remove")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
