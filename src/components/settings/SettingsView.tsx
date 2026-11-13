"use client";

import { Clock3, Gauge, Laptop, Moon, Palette, Ruler, RotateCcw, Sun, Thermometer, Trash2, Wind } from "lucide-react";
import {
  DEFAULT_SETTINGS,
  removeSavedCity,
  resetSavedCities,
  updateSettings,
  useHydrated,
  useNow,
  useSavedCities,
  useSettings,
  type Settings,
} from "@/lib/store";
import { formatTime, localTz } from "@/lib/time";
import { fmtDistance, fmtPrecip, fmtPressure, fmtTemp, fmtWind } from "@/lib/units";
import { Flag, MetaIcon, Segmented } from "../ui";

export function SettingsView() {
  const s = useSettings();
  const hydrated = useHydrated();
  const now = useNow();
  const cities = useSavedCities();

  const row = <K extends keyof Settings>(
    key: K,
    icon: React.ReactNode,
    title: string,
    preview: React.ReactNode,
    options: { value: Settings[K]; label: React.ReactNode }[],
  ) => (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">{icon}</span>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted tabular">{hydrated ? preview : " "}</p>
        </div>
      </div>
      <Segmented label={title} value={s[key]} onChange={(v) => updateSettings({ [key]: v } as Partial<Settings>)} options={options} />
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-muted">Saved in this browser and applied everywhere instantly.</p>
      </header>

      <section className="card rise p-5 sm:p-6">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted">
          <Palette className="size-4" /> Appearance
        </h2>
        <div className="grid grid-cols-3 gap-3 py-2">
          {([
            { value: "light", label: "Light", icon: Sun, preview: "from-sky-100 to-white" },
            { value: "dark", label: "Dark", icon: Moon, preview: "from-slate-900 to-slate-700" },
            { value: "system", label: "System", icon: Laptop, preview: "from-sky-100 via-slate-400 to-slate-900" },
          ] as const).map(({ value, label, icon: Icon, preview }) => {
            const active = hydrated && s.theme === value;
            return (
              <button
                key={value}
                onClick={() => updateSettings({ theme: value })}
                aria-pressed={active}
                className={`rounded-2xl border p-2 text-left transition ${active ? "border-accent ring-4 ring-accent/15" : "border-line hover:border-accent/40"}`}
              >
                <span className={`block h-20 rounded-xl bg-gradient-to-br ${preview}`} />
                <span className="mt-2 flex items-center gap-2 px-1 text-sm font-medium">
                  <Icon className="size-4" /> {label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="card rise divide-y divide-line px-5 sm:px-6">
        <h2 className="flex items-center gap-2 pb-2 pt-5 text-sm font-semibold uppercase tracking-wider text-muted sm:pt-6">
          <Ruler className="size-4" /> Units & format
        </h2>
        {row("temp", <Thermometer className="size-5" />, "Temperature", `21 °C shows as ${fmtTemp(21, s, true)}`, [
          { value: "c", label: "°C" },
          { value: "f", label: "°F" },
        ])}
        {row("wind", <Wind className="size-5" />, "Wind speed", `20 km/h shows as ${fmtWind(20, s)}`, [
          { value: "kmh", label: "km/h" },
          { value: "mph", label: "mph" },
          { value: "ms", label: "m/s" },
          { value: "kn", label: "kn" },
        ])}
        {row("precip", <MetaIcon name="raindrop" size={28} />, "Precipitation", `5 mm shows as ${fmtPrecip(5, s)}`, [
          { value: "mm", label: "mm" },
          { value: "in", label: "in" },
        ])}
        {row("pressure", <Gauge className="size-5" />, "Pressure", `1013 hPa shows as ${fmtPressure(1013, s)}`, [
          { value: "hpa", label: "hPa" },
          { value: "inhg", label: "inHg" },
          { value: "mmhg", label: "mmHg" },
        ])}
        {row("distance", <Ruler className="size-5" />, "Visibility distance", `10 km shows as ${fmtDistance(10000, s)}`, [
          { value: "km", label: "km" },
          { value: "mi", label: "mi" },
        ])}
        {row("clock", <Clock3 className="size-5" />, "Clock", now ? `Your time: ${formatTime(now, localTz(), s.clock, true)}` : " ", [
          { value: "24", label: "24-hour" },
          { value: "12", label: "12-hour" },
        ])}
        <div className="flex justify-end py-4">
          <button
            onClick={() => updateSettings({ ...DEFAULT_SETTINGS, theme: s.theme })}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink"
          >
            <RotateCcw className="size-4" /> Reset units
          </button>
        </div>
      </section>

      <section className="card rise p-5 sm:p-6">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted">
          <MetaIcon name="compass" size={22} /> Saved cities
        </h2>
        {hydrated && cities.length === 0 && (
          <p className="py-4 text-sm text-muted">
            No saved cities. The dashboard will be empty until you save one.{" "}
            <button className="font-medium text-accent hover:underline" onClick={resetSavedCities}>
              Restore defaults
            </button>
          </p>
        )}
        <ul className="divide-y divide-line">
          {hydrated &&
            cities.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-3">
                <Flag code={c.countryCode} size={14} />
                <span className="flex-1">
                  <span className="font-medium">{c.name}</span>
                  <span className="ml-2 text-sm text-muted">{c.country}</span>
                </span>
                <span className="hidden text-xs text-faint sm:block">{c.timezone}</span>
                <button onClick={() => removeSavedCity(c.id)} aria-label={`Remove ${c.name}`} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-rose-500/10 hover:text-rose-500">
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}
