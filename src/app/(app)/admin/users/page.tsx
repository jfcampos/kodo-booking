import { auth } from "@/lib/auth";
import { listUsers } from "@/lib/actions/users";
import { UserTable } from "@/components/admin/user-table";
import { InviteDialog } from "@/components/admin/invite-dialog";
import { getTranslations } from "next-intl/server";

export default async function AdminUsersPage() {
  const session = await auth();
  const users = await listUsers();
  const t = await getTranslations("AdminUsers");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <InviteDialog />
      </div>
      <UserTable users={users} currentUserId={session!.user.id} />
    </div>
  );
}
