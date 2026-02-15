import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getTranslations } from "next-intl/server";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const t = await getTranslations("Auth");
  const tc = await getTranslations("Common");

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Kodo Booking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <Button variant="outline" className="w-full" type="submit">
              {t("signInWithGoogle")}
            </Button>
          </form>

          <div className="flex items-center gap-2">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">{t("or")}</span>
            <Separator className="flex-1" />
          </div>

          <form
            action={async (formData: FormData) => {
              "use server";
              try {
                await signIn("credentials", {
                  email: formData.get("email"),
                  password: formData.get("password"),
                  redirectTo: "/",
                });
              } catch (err) {
                if (err instanceof AuthError) {
                  const { getTranslations } = await import("next-intl/server");
                  const t = await getTranslations("Auth");
                  redirect(`/sign-in?error=${encodeURIComponent(t("invalidCredentials"))}`);
                }
                throw err;
              }
            }}
            className="space-y-3"
          >
            <div>
              <Label htmlFor="email">{tc("email")}</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div>
              <Label htmlFor="password">{tc("password")}</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button className="w-full" type="submit">
              {t("signIn")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
