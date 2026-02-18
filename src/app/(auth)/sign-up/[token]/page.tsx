"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { register, googleSignUpWithInvite } from "@/lib/actions/auth";

export default function SignUpPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const t = useTranslations("Auth");
  const tc = useTranslations("Common");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      const result = await register({
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        token,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.push("/sign-in");
    } catch {
      setError(t("registrationFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-2xl">{t("createAccount")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            action={async () => {
              try {
                const result = await googleSignUpWithInvite(token);
                if (result && "error" in result) {
                  setError(result.error);
                }
              } catch {
                setError(t("registrationFailed"));
              }
            }}
          >
            <Button variant="outline" className="w-full" type="submit">
              {t("signUpWithGoogle")}
            </Button>
          </form>

          <div className="flex items-center gap-2">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">{t("or")}</span>
            <Separator className="flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label htmlFor="name">{tc("name")}</Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="email">{tc("email")}</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div>
              <Label htmlFor="password">{tc("password")}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={8}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? t("creating") : t("createAccount")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
