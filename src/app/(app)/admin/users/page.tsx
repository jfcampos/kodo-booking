import { auth } from "@/lib/auth";
import { listUsers } from "@/lib/actions/users";
import { UserTable } from "@/components/admin/user-table";

export default async function AdminUsersPage() {
  const session = await auth();
  const users = await listUsers();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Users</h1>
      <UserTable users={users} currentUserId={session!.user.id} />
    </div>
  );
}
