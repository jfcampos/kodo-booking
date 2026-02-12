import { getSettings } from "@/lib/actions/settings";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <SettingsForm settings={settings} />
    </div>
  );
}
