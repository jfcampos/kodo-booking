import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const t = await getTranslations("Admin");

  const adminLinks = [
    { href: "/admin", label: t("dashboard") },
    { href: "/admin/users", label: t("users") },
    { href: "/admin/rooms", label: t("rooms") },
    { href: "/admin/bookings", label: t("bookings") },
    { href: "/admin/settings", label: t("settings") },
  ];

  return (
    <div className="space-y-4">
      <nav className="flex gap-2 border-b pb-2">
        {adminLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Button variant="ghost" size="sm">
              {link.label}
            </Button>
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
