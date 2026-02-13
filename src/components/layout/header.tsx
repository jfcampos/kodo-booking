import { auth, signOut } from "@/lib/auth";
import { stopImpersonating } from "@/lib/actions/users";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import Link from "next/link";

export async function Header() {
  const session = await auth();
  if (!session?.user) return null;

  const impersonatedBy = (session as any).impersonatedBy as string | undefined;

  return (
    <>
      {impersonatedBy && (
        <div className="bg-yellow-500 text-yellow-950 text-center text-sm py-1 px-4 flex items-center justify-center gap-3">
          <span>Impersonating {session.user.name ?? session.user.email}</span>
          <form
            action={async () => {
              "use server";
              await stopImpersonating();
            }}
          >
            <Button variant="outline" size="sm" className="h-6 text-xs border-yellow-950/30">
              Stop
            </Button>
          </form>
        </div>
      )}
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="font-semibold">
            Kodo Booking
          </Link>
          <div className="flex items-center gap-4">
            {(session.user.role === "ADMIN" || impersonatedBy) && (
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
            <ThemeToggle />
            <Link href="/settings" className="text-sm text-muted-foreground hover:underline">
              {session.user.name}
            </Link>
            {!impersonatedBy && (
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
            )}
          </div>
        </div>
      </header>
    </>
  );
}
