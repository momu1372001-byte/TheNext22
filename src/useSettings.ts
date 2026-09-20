import { useCallback, useEffect, useState } from "react";

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export type DailyGoal = 5 | 10 | 20 | 30;

export interface Settings {
  dailyGoal: DailyGoal;
  cefrLevel: CefrLevel;
  sound: boolean;
  notifications: boolean;
  darkMode: boolean;
}

const STORAGE_KEY = "app.settings";

export const DEFAULT_SETTINGS: Settings = {
  dailyGoal: 10,
  cefrLevel: "A1",
  sound: true,
  notifications: true,
  darkMode: true,
};

const CEFR_LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
const DAILY_GOALS: DailyGoal[] = [5, 10, 20, 30];

function isCefrLevel(v: unknown): v is CefrLevel {
  return typeof v === "string" && (CEFR_LEVELS as string[]).includes(v);
}

function isDailyGoal(v: unknown): v is DailyGoal {
  return typeof v === "number" && (DAILY_GOALS as number[]).includes(v);
}

function normalize(raw: Partial<Settings> | null): Settings {
  if (!raw) return DEFAULT_SETTINGS;
  return {
    dailyGoal: isDailyGoal(raw.dailyGoal) ? raw.dailyGoal : DEFAULT_SETTINGS.dailyGoal,
    cefrLevel: isCefrLevel(raw.cefrLevel) ? raw.cefrLevel : DEFAULT_SETTINGS.cefrLevel,
    sound: typeof raw.sound === "boolean" ? raw.sound : DEFAULT_SETTINGS.sound,
    notifications:
      typeof raw.notifications === "boolean" ? raw.notifications : DEFAULT_SETTINGS.notifications,
    darkMode: typeof raw.darkMode === "boolean" ? raw.darkMode : DEFAULT_SETTINGS.darkMode,
  };
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return normalize(JSON.parse(raw) as Partial<Settings>);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // ignore quota / privacy errors
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return { settings, update, reset };
}


