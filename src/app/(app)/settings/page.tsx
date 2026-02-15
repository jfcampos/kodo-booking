import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserSettingsForm } from "@/components/settings/user-settings-form";
import { getTranslations } from "next-intl/server";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, color: true },
  });

  if (!user) {
    await signOut({ redirectTo: "/sign-in" });
    return null;
  }

  const t = await getTranslations("Settings");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <UserSettingsForm name={user.name ?? ""} email={user.email} color={user.color} />
    </div>
  );
}
