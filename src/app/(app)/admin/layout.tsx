import Link from "next/link";
import { Button } from "@/components/ui/button";

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/rooms", label: "Rooms" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
