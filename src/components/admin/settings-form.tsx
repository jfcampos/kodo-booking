"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSettings } from "@/lib/actions/settings";

type Settings = {
  granularityMinutes: number;
  maxAdvanceDays: number;
  maxActiveBookings: number;
  maxBookingDurationHours: number;
};

export function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const t = useTranslations("AdminSettings");
  const tc = useTranslations("Common");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setSaved(false);
    try {
      const result = await updateSettings({
        granularityMinutes: Number(formData.get("granularityMinutes")),
        maxAdvanceDays: Number(formData.get("maxAdvanceDays")),
        maxActiveBookings: Number(formData.get("maxActiveBookings")),
        maxBookingDurationHours: Number(formData.get("maxBookingDurationHours")),
      });
      if (result && "error" in result) return;
      setSaved(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="max-w-md space-y-4">
      <div>
        <Label>{t("granularity")}</Label>
        <Input
          name="granularityMinutes"
          type="number"
          defaultValue={settings.granularityMinutes}
          min={5}
          max={120}
        />
      </div>
      <div>
        <Label>{t("maxAdvanceDays")}</Label>
        <Input
          name="maxAdvanceDays"
          type="number"
          defaultValue={settings.maxAdvanceDays}
          min={1}
          max={365}
        />
      </div>
      <div>
        <Label>{t("maxActiveBookings")}</Label>
        <Input
          name="maxActiveBookings"
          type="number"
          defaultValue={settings.maxActiveBookings}
          min={1}
          max={50}
        />
      </div>
      <div>
        <Label>{t("maxDuration")}</Label>
        <Input
          name="maxBookingDurationHours"
          type="number"
          defaultValue={settings.maxBookingDurationHours}
          min={1}
          max={24}
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? tc("saving") : t("saveSettings")}
      </Button>
      {saved && <p className="text-sm text-green-600">{tc("saved")}</p>}
    </form>
  );
}
