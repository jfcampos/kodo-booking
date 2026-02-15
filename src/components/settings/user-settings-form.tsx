"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateMyName, updateMyColor } from "@/lib/actions/users";

export function UserSettingsForm({
  name,
  email,
  color,
}: {
  name: string;
  email: string;
  color: string;
}) {
  const router = useRouter();
  const t = useTranslations("Settings");
  const tc = useTranslations("Common");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setSaved(false);
    setError(null);
    try {
      await updateMyName(formData.get("name") as string);
      await updateMyColor(formData.get("color") as string);
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : tc("failedToSave"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="max-w-md space-y-4">
      <div>
        <Label>{tc("email")}</Label>
        <Input value={email} disabled />
      </div>
      <div>
        <Label>{tc("name")}</Label>
        <Input name="name" defaultValue={name} required maxLength={100} />
      </div>
      <div>
        <Label>{t("bookingColor")}</Label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            name="color"
            defaultValue={color}
            className="h-10 w-14 cursor-pointer rounded border bg-transparent p-1"
          />
          <span className="text-sm text-muted-foreground">
            {t("colorHint")}
          </span>
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? tc("saving") : tc("save")}
      </Button>
      {saved && <p className="text-sm text-green-600">{tc("saved")}</p>}
    </form>
  );
}
