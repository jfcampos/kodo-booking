"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Sun, Moon } from "lucide-react";

export function CalendarSettings() {
  const t = useTranslations("Calendar");
  const tTheme = useTranslations("Theme");
  const { theme, setTheme } = useTheme();

  const [resolution, setResolution] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("cal-resolution") || "60";
    }
    return "60";
  });

  const [zoom, setZoom] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("cal-slot-height") || "3";
    }
    return "3";
  });

  const RESOLUTION_OPTIONS = [
    { value: "15", label: "15 min" },
    { value: "30", label: "30 min" },
    { value: "60", label: "1 hora" },
  ];

  const SLOT_HEIGHT_OPTIONS = [
    { value: "2", label: t("compact") },
    { value: "3", label: t("medium") },
    { value: "4", label: t("default") },
    { value: "5", label: t("tall") },
    { value: "6", label: t("extraTall") },
  ];

  function updateSetting(key: string, value: string) {
    localStorage.setItem(key, value);
    window.dispatchEvent(new StorageEvent("storage", { key, newValue: value }));
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Search className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 space-y-3">
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">{t("resolution")}</span>
          <Select
            value={resolution}
            onValueChange={(v) => {
              setResolution(v);
              updateSetting("cal-resolution", v);
            }}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RESOLUTION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">{t("zoom")}</span>
          <Select
            value={zoom}
            onValueChange={(v) => {
              setZoom(v);
              updateSetting("cal-slot-height", v);
            }}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SLOT_HEIGHT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1 border-t">
          <Button
            variant={theme === "light" ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs"
            onClick={() => setTheme("light")}
          >
            <Sun className="mr-1.5 h-3.5 w-3.5" />
            {tTheme("light")}
          </Button>
          <Button
            variant={theme === "dark" ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs"
            onClick={() => setTheme("dark")}
          >
            <Moon className="mr-1.5 h-3.5 w-3.5" />
            {tTheme("dark")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
