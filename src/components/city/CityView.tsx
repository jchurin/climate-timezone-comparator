"use client";

import { ArrowLeftRight, ChevronRight, Clock3, Columns3, Star } from "lucide-react";
import Link from "next/link";
import { useForecasts } from "@/lib/hooks";
import { toggleSavedCity, useSavedCities, useSettings } from "@/lib/store";
import { cityZoneToken } from "@/lib/time";
import type { City } from "@/lib/types";
import { fmtTemp, fmtWind } from "@/lib/units";
import { weatherInfo } from "@/lib/weather-codes";
import { Flag, WeatherIcon } from "../ui";
import { WeatherScene } from "../WeatherScene";
import { DailyForecast } from "./DailyForecast";
import { Details } from "./Details";
import { HourlyForecast } from "./HourlyForecast";
import { SunCard } from "./SunCard";
import { TimeCard } from "./TimeCard";

export function CityView({ city }: { city: City }) {
  const s = useSettings();
  const saved = useSavedCities();
  const isSaved = saved.some((c) => c.id === city.id);
  const { data, error } = useForecasts([city]);
  const fc = data?.[city.id];
  const cur = fc?.current;
  const isDay = cur ? cur.is_day === 1 : true;
  const info = cur ? weatherInfo(cur.weather_code, isDay) : null;

  const compareIds = [city.id, ...saved.filter((c) => c.id !== city.id).slice(0, 2).map((c) => c.id)];

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Dashboard</Link>
        <ChevronRight className="size-3.5" />
        <span className="text-ink">{city.name}</span>
      </nav>

      {/* Hero */}
      <section className="rise relative min-h-[380px] overflow-hidden rounded-[2rem] text-white shadow-2xl shadow-slate-900/20">
        {info ? <WeatherScene scene={info.scene} isDay={isDay} /> : <div className="scene bg-gradient-to-br from-slate-500 to-slate-700" />}
        <div className="relative grid gap-6 p-6 sm:p-10 md:grid-cols-[1fr_auto]">
          <div>
            <div className="flex items-center gap-3">
              <Flag code={city.countryCode} size={22} />
              <h1 className="text-4xl font-semibold tracking-tight drop-shadow sm:text-5xl">{city.name}</h1>
            </div>
            <p className="mt-1 text-white/80">{[city.admin1, city.country].filter(Boolean).join(", ")}</p>

            <div className="mt-8 flex items-start gap-2">
              <span className="text-[7rem] font-extralight leading-[0.85] tracking-tighter drop-shadow-lg tabular sm:text-[9rem]">
                {cur ? fmtTemp(cur.temperature_2m, s).replace("°", "") : "--"}
              </span>
              <span className="mt-3 text-4xl font-light">°{s.temp.toUpperCase()}</span>
            </div>
            <p className="mt-3 text-2xl font-medium drop-shadow">{info?.label ?? (error ? "Weather unavailable" : "Loading…")}</p>
            {cur && fc && (
              <p className="mt-1 text-white/85">
                Feels like {fmtTemp(cur.apparent_temperature, s)} · H {fmtTemp(fc.daily.temperature_2m_max[0], s)} · L{" "}
                {fmtTemp(fc.daily.temperature_2m_min[0], s)}
              </p>
            )}
          </div>
          {cur && (
            <div className="flex flex-col items-start justify-between gap-4 md:items-end">
              <WeatherIcon code={cur.weather_code} isDay={isDay} size={180} className="-my-6 drop-shadow-2xl md:-mr-6" />
              <div className="flex flex-wrap gap-2">
                <Chip>💧 {cur.relative_humidity_2m}%</Chip>
                <Chip>💨 {fmtWind(cur.wind_speed_10m, s)}</Chip>
                {fc?.daily.precipitation_probability_max[0] != null && <Chip>☔ {fc.daily.precipitation_probability_max[0]}%</Chip>}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => toggleSavedCity(city)}
          aria-pressed={isSaved}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            isSaved ? "bg-amber-400/15 text-amber-600 ring-1 ring-amber-400/40 dark:text-amber-300" : "bg-accent text-white shadow-lg shadow-blue-500/25 hover:brightness-110"
          }`}
        >
          <Star className={`size-4 ${isSaved ? "fill-current" : ""}`} />
          {isSaved ? "Saved to dashboard" : "Save to dashboard"}
        </button>
        <ActionLink href={`/compare?cities=${compareIds.join(",")}`} icon={<Columns3 className="size-4" />}>
          Compare
        </ActionLink>
        <ActionLink href={`/time?from=${encodeURIComponent(cityZoneToken(city.timezone, city.name))}`} icon={<ArrowLeftRight className="size-4" />}>
          Convert time
        </ActionLink>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {fc ? <HourlyForecast fc={fc} tz={city.timezone} /> : <div className="skeleton h-[220px] !rounded-3xl" />}
          {fc ? <DailyForecast fc={fc} tz={city.timezone} /> : <div className="skeleton h-[420px] !rounded-3xl" />}
        </div>
        <div className="space-y-6">
          <TimeCard city={city} />
          {fc ? <SunCard fc={fc} tz={city.timezone} /> : <div className="skeleton h-[240px] !rounded-3xl" />}
        </div>
      </div>

      {fc ? <Details fc={fc} /> : <div className="skeleton h-[300px] !rounded-3xl" />}

      <p className="flex items-center justify-center gap-1.5 text-xs text-faint">
        <Clock3 className="size-3.5" /> Weather updates every 10 minutes
      </p>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium backdrop-blur-md ring-1 ring-white/20">{children}</span>;
}

function ActionLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold transition hover:border-accent/40 hover:text-accent"
    >
      {icon}
      {children}
    </Link>
  );
}
