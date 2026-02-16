"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { changeUserRole, removeUser, impersonateUser } from "@/lib/actions/users";

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

  async function handleRoleChange(userId: string, role: Role) {
    setLoading(userId);
    try {
      await changeUserRole(userId, role);
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleRemove(userId: string) {
    if (!confirm(t("confirmRemove"))) return;
    setLoading(userId);
    try {
      await removeUser(userId);
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
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
                    await impersonateUser(user.id);
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
                onClick={() => handleRemove(user.id)}
                disabled={loading === user.id}
              >
                {t("remove")}
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
