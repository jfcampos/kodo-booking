import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stopImpersonating } from "@/lib/actions/users";
import { Button } from "@/components/ui/button";
import { CalendarSettings } from "@/components/layout/calendar-settings";
import { ViewModeToggle } from "@/components/layout/view-mode-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function Header() {
  const session = await auth();
  if (!session?.user) return null;

  const t = await getTranslations("Header");
  const impersonatedBy = (session as any).impersonatedBy as string | undefined;

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { color: true },
  });

  return (
    <>
      {impersonatedBy && (
        <div className="bg-yellow-500 text-yellow-950 text-center text-sm py-1 px-4 flex items-center justify-center gap-3">
          <span>{t("impersonating", { name: session.user.name ?? session.user.email ?? "" })}</span>
          <form
            action={async () => {
              "use server";
              await stopImpersonating();
            }}
          >
            <Button variant="outline" size="sm" className="h-6 text-xs border-yellow-950/30">
              {t("stopImpersonating")}
            </Button>
          </form>
        </div>
      )}
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="font-semibold">
            Kodo Booking
          </Link>
          <div className="flex items-center gap-1">
            <ViewModeToggle />
            <CalendarSettings />
            <UserMenu
              name={session.user.name ?? null}
              email={session.user.email ?? null}
              image={session.user.image ?? null}
              color={dbUser?.color ?? "#6366f1"}
              role={session.user.role}
              isImpersonating={!!impersonatedBy}
              signOutAction={async () => {
                "use server";
                await signOut({ redirectTo: "/sign-in" });
              }}
            />
          </div>
        </div>
      </header>
    </>
  );
}
