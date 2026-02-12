"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { changeUserRole, removeUser } from "@/lib/actions/users";

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
    if (!confirm("Remove this user?")) return;
    setLoading(userId);
    try {
      await removeUser(userId);
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.name ?? "\u2014"}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              {user.id === currentUserId ? (
                <Badge>{user.role}</Badge>
              ) : (
                <Select
                  defaultValue={user.role}
                  onValueChange={(v) => handleRoleChange(user.id, v as Role)}
                  disabled={loading === user.id}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="VIEWER">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </TableCell>
            <TableCell>
              {user.id !== currentUserId && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemove(user.id)}
                  disabled={loading === user.id}
                >
                  Remove
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
