import { getSettings } from "@/lib/actions/settings";
import { SettingsForm } from "@/components/admin/settings-form";
import { getTranslations } from "next-intl/server";

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  const t = await getTranslations("AdminSettings");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <SettingsForm settings={settings} />
    </div>
  );
}
