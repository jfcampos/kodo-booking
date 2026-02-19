"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CalendarDays, CalendarRange } from "lucide-react";

export function ViewModeToggle() {
  const [mode, setMode] = useState<"weekly" | "monthly">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("cal-view-mode") as "weekly" | "monthly") || "weekly";
    }
    return "weekly";
  });

  function toggle() {
    const next = mode === "weekly" ? "monthly" : "weekly";
    setMode(next);
    localStorage.setItem("cal-view-mode", next);
    window.dispatchEvent(
      new StorageEvent("storage", { key: "cal-view-mode", newValue: next })
    );
  }

  return (
    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggle}>
      {mode === "weekly" ? (
        <CalendarDays className="h-4 w-4" />
      ) : (
        <CalendarRange className="h-4 w-4" />
      )}
    </Button>
  );
}
