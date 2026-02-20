"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateMyName, updateMyColor } from "@/lib/actions/users";
import { BOOKING_COLORS } from "@/lib/colors";
import { Check } from "lucide-react";

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
  const [selectedColor, setSelectedColor] = useState(color);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setSaved(false);
    setError(null);
    try {
      const nameResult = await updateMyName(formData.get("name") as string);
      if (nameResult && "error" in nameResult) { setError(nameResult.error); return; }
      const colorResult = await updateMyColor(selectedColor);
      if (colorResult && "error" in colorResult) { setError(colorResult.error); return; }
      setSaved(true);
      router.refresh();
    } catch {
      setError(tc("failedToSave"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="max-w-md space-y-4">
      <div className="space-y-3">
        <Label>{tc("email")}</Label>
        <Input value={email} disabled />
      </div>
      <div className="space-y-3">
        <Label>{tc("name")}</Label>
        <Input name="name" defaultValue={name} required maxLength={100} />
      </div>
      <div className="space-y-3">
        <Label>{t("bookingColor")}</Label>
        <div className="flex flex-wrap gap-2">
          {BOOKING_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedColor(c)}
              className="flex items-center justify-center h-8 w-8 rounded-full border-2 cursor-pointer transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                borderColor: selectedColor === c ? "white" : "transparent",
              }}
            >
              {selectedColor === c && (
                <Check className="h-4 w-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
              )}
            </button>
          ))}
        </div>
        <span className="text-sm text-muted-foreground mt-1 block">
          {t("colorHint")}
        </span>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? tc("saving") : tc("save")}
      </Button>
      {saved && <p className="text-sm text-green-600">{tc("saved")}</p>}
    </form>
  );
}
