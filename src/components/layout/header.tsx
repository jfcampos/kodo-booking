import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export async function Header() {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="font-semibold">
          Kodo Booking
        </Link>
        <div className="flex items-center gap-4">
          {session.user.role === "ADMIN" && (
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                Admin
              </Button>
            </Link>
          )}
          <Link href="/history">
            <Button variant="ghost" size="sm">
              History
            </Button>
          </Link>
          <span className="text-sm text-muted-foreground">
            {session.user.name}
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/sign-in" });
            }}
          >
            <Button variant="outline" size="sm" type="submit">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
