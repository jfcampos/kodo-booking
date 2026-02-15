"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const t = useTranslations("Error");
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <p className="text-destructive">{t("title")}</p>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <Button onClick={reset}>{t("tryAgain")}</Button>
    </div>
  );
}
