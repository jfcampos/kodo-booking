import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserSettingsForm } from "@/components/settings/user-settings-form";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { name: true, email: true, color: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <UserSettingsForm name={user.name ?? ""} email={user.email} color={user.color} />
    </div>
  );
}
