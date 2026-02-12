"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSettings } from "@/lib/actions/settings";

type Settings = {
  granularityMinutes: number;
  maxAdvanceDays: number;
  maxActiveBookings: number;
};

export function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setSaved(false);
    try {
      await updateSettings({
        granularityMinutes: Number(formData.get("granularityMinutes")),
        maxAdvanceDays: Number(formData.get("maxAdvanceDays")),
        maxActiveBookings: Number(formData.get("maxActiveBookings")),
      });
      setSaved(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="max-w-md space-y-4">
      <div>
        <Label>Time Slot Granularity (minutes)</Label>
        <Input
          name="granularityMinutes"
          type="number"
          defaultValue={settings.granularityMinutes}
          min={5}
          max={120}
        />
      </div>
      <div>
        <Label>Max Advance Booking (days)</Label>
        <Input
          name="maxAdvanceDays"
          type="number"
          defaultValue={settings.maxAdvanceDays}
          min={1}
          max={365}
        />
      </div>
      <div>
        <Label>Max Active Bookings Per User</Label>
        <Input
          name="maxActiveBookings"
          type="number"
          defaultValue={settings.maxActiveBookings}
          min={1}
          max={50}
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save Settings"}
      </Button>
      {saved && <p className="text-sm text-green-600">Saved</p>}
    </form>
  );
}
