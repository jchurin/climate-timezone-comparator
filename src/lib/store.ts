"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_CITIES } from "./api";
import type { City } from "./types";

/**
 * Tiny localStorage-backed store. Uses useSyncExternalStore with a server
 * snapshot equal to the defaults, so SSR and the first client render always
 * match (no hydration errors), then React re-renders with the saved value.
 */
function createStore<T>(key: string, fallback: T, merge?: (saved: T) => T) {
  let cache: T | undefined;
  const listeners = new Set<() => void>();

  const read = (): T => {
    if (cache === undefined) {
      try {
        const raw = localStorage.getItem(key);
        cache = raw ? (merge ? merge(JSON.parse(raw)) : JSON.parse(raw)) : fallback;
      } catch {
        cache = fallback;
      }
    }
    return cache as T;
  };

  const subscribe = (cb: () => void) => {
    listeners.add(cb);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) {
        cache = undefined;
        cb();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(cb);
      window.removeEventListener("storage", onStorage);
    };
  };

  const set = (next: T | ((prev: T) => T)) => {
    cache = typeof next === "function" ? (next as (p: T) => T)(read()) : next;
    try {
      localStorage.setItem(key, JSON.stringify(cache));
    } catch {
      /* storage unavailable: keep in memory */
    }
    listeners.forEach((l) => l());
  };

  const use = () => useSyncExternalStore(subscribe, read, () => fallback);
  return { use, set, read };
}

/* ------------------------------ Settings ------------------------------ */

export type Settings = {
  temp: "c" | "f";
  wind: "kmh" | "mph" | "ms" | "kn";
  precip: "mm" | "in";
  pressure: "hpa" | "inhg" | "mmhg";
  distance: "km" | "mi";
  clock: "24" | "12";
  theme: "system" | "light" | "dark";
};

export const DEFAULT_SETTINGS: Settings = {
  temp: "c",
  wind: "kmh",
  precip: "mm",
  pressure: "hpa",
  distance: "km",
  clock: "24",
  theme: "system",
};

export const SETTINGS_KEY = "tiempo:settings";

const settingsStore = createStore<Settings>(SETTINGS_KEY, DEFAULT_SETTINGS, (s) => ({ ...DEFAULT_SETTINGS, ...s }));

export function useSettings() {
  return settingsStore.use();
}

export function updateSettings(patch: Partial<Settings>) {
  settingsStore.set((s) => ({ ...s, ...patch }));
}

/* ---------------------------- Saved cities ---------------------------- */

const citiesStore = createStore<City[]>("tiempo:cities", DEFAULT_CITIES);

export function useSavedCities() {
  return citiesStore.use();
}

export function toggleSavedCity(city: City) {
  citiesStore.set((list) =>
    list.some((c) => c.id === city.id) ? list.filter((c) => c.id !== city.id) : [...list, city],
  );
}

export function resetSavedCities() {
  citiesStore.set(DEFAULT_CITIES);
}

export function removeSavedCity(id: number) {
  citiesStore.set((list) => list.filter((c) => c.id !== id));
}

/* ------------------------------- Clocks ------------------------------- */

let now = 0;
let timer: ReturnType<typeof setInterval> | undefined;
const clockListeners = new Set<() => void>();

function subscribeClock(cb: () => void) {
  clockListeners.add(cb);
  if (!timer) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      clockListeners.forEach((l) => l());
    }, 1000);
  }
  return () => {
    clockListeners.delete(cb);
    if (!clockListeners.size && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

/**
 * Current time in ms, ticking every second. Returns 0 during SSR/hydration so
 * clocks render a placeholder instead of a mismatching time.
 */
export function useNow() {
  return useSyncExternalStore(
    subscribeClock,
    () => now || (now = Date.now()),
    () => 0,
  );
}

const noop = () => () => {};
/** False on the server and during hydration, true afterwards. */
export function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false);
}
