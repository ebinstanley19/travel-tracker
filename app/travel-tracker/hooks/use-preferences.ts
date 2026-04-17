"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export type Prefs = {
  theme: "sand" | "ocean" | "sunset" | "white";
  dateFormat: "dmy" | "mdy";
  defaultView: string;
  homeCountry: string;
};

function readLocalPrefs(): Prefs {
  if (typeof window === "undefined") {
    return { theme: "sand", dateFormat: "dmy", defaultView: "timeline", homeCountry: "" };
  }
  const theme = localStorage.getItem("routebook-theme");
  const dateFormat = localStorage.getItem("routebook-date-format");
  const defaultView = localStorage.getItem("routebook-default-view");
  const homeCountry = localStorage.getItem("routebook-home-country");
  return {
    theme: theme === "sand" || theme === "ocean" || theme === "sunset" || theme === "white" ? theme : "sand",
    dateFormat: dateFormat === "mdy" ? "mdy" : "dmy",
    defaultView: defaultView === "table" || defaultView === "map" || defaultView === "insights" ? defaultView : "timeline",
    homeCountry: homeCountry ?? "",
  };
}

function syncToLocalStorage(prefs: Prefs): void {
  localStorage.setItem("routebook-theme", prefs.theme);
  localStorage.setItem("routebook-date-format", prefs.dateFormat);
  localStorage.setItem("routebook-default-view", prefs.defaultView);
  if (prefs.homeCountry) {
    localStorage.setItem("routebook-home-country", prefs.homeCountry);
  } else {
    localStorage.removeItem("routebook-home-country");
  }
}

function applyThemeToDOM(theme: Prefs["theme"]): void {
  document.documentElement.setAttribute("data-theme", theme);
}

export function usePreferences(user: User | null): {
  prefs: Prefs;
  prefsLoading: boolean;
  savePreferences: (patch: Partial<Prefs>) => Promise<void>;
} {
  const [prefs, setPrefs] = useState<Prefs>(readLocalPrefs);
  const [prefsLoading, setPrefsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    setPrefsLoading(true);

    async function load() {
      const { data } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user!.id)
        .single();

      if (!mounted) return;

      if (data) {
        const loaded: Prefs = {
          theme: data.theme === "sand" || data.theme === "ocean" || data.theme === "sunset" || data.theme === "white" ? data.theme : "sand",
          dateFormat: data.date_format === "mdy" ? "mdy" : "dmy",
          defaultView: data.default_view === "table" || data.default_view === "map" || data.default_view === "insights" ? data.default_view : "timeline",
          homeCountry: data.home_country ?? "",
        };
        setPrefs(loaded);
        syncToLocalStorage(loaded);
        applyThemeToDOM(loaded.theme);
      }

      setPrefsLoading(false);
    }

    void load();
    return () => { mounted = false; };
  }, [user?.id]);

  async function savePreferences(patch: Partial<Prefs>): Promise<void> {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    syncToLocalStorage(next);
    applyThemeToDOM(next.theme);

    if (user) {
      await supabase.from("user_preferences").upsert({
        user_id: user.id,
        theme: next.theme,
        date_format: next.dateFormat,
        default_view: next.defaultView,
        home_country: next.homeCountry,
        updated_at: new Date().toISOString(),
      });
    }
  }

  return { prefs, prefsLoading, savePreferences };
}
