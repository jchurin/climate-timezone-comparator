"use client";

import { useEffect } from "react";
import { useHydrated, useSettings } from "@/lib/store";

/** Keeps <html data-theme> in sync with the theme setting (and the OS when set to "system"). */
export function ThemeController() {
  const { theme } = useSettings();
  const hydrated = useHydrated();

  useEffect(() => {
    if (!hydrated) return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.theme = theme === "system" ? (mq.matches ? "dark" : "light") : theme;
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme, hydrated]);

  return null;
}
