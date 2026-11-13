"use client";

import { Columns3, LineChart as LineIcon, Plus, Table2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cityHref } from "@/lib/api";
import { useCities, useForecasts } from "@/lib/hooks";
import { useHydrated, useNow, useSavedCities, useSettings, type Settings } from "@/lib/store";
import { fmtDiff, formatDate, formatTime, localTz, tzOffset } from "@/lib/time";
import type { City, Forecast } from "@/lib/types";
import { fmtDuration, fmtPrecip, fmtTemp, fmtWind, temp, WIND_LABEL } from "@/lib/units";
import { weatherInfo } from "@/lib/weather-codes";
import { LiveClock } from "../LiveClock";
import { CityCombobox } from "../search/CityCombobox";
import { Flag, Segmented, SectionTitle, WeatherIcon } from "../ui";
import { WeatherScene } from "../WeatherScene";

const MAX = 4;
const SERIES = ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)"];

type Metric = "max" | "min" | "rain" | "wind" | "uv";
const METRICS: { value: Metric; label: string }[] = [
  { value: "max", label: "High" },
  { value: "min", label: "Low" },
  { value: "rain", label: "Rain %" },
  { value: "wind", label: "Wind" },
  { value: "uv", label: "UV" },
];

function metricValue(fc: Forecast, i: number, m: Metric, s: Settings): number | null {
  const d = fc.daily;
  switch (m) {
    case "max": return Math.round(temp(d.temperature_2m_max[i], s));
    case "min": return Math.round(temp(d.temperature_2m_min[i], s));
    case "rain": return d.precipitation_probability_max[i];
    case "wind": {
      const kmh = d.wind_speed_10m_max[i];
      return Math.round({ kmh, mph: kmh * 0.621371, ms: kmh / 3.6, kn: kmh * 0.539957 }[s.wind]);
    }
    case "uv": return Math.round(d.uv_index_max[i] * 10) / 10;
  }
}

function metricUnit(m: Metric, s: Settings) {
  return m === "max" || m === "min" ? `°${s.temp.toUpperCase()}` : m === "rain" ? "%" : m === "wind" ? WIND_LABEL[s.wind] : "";
}

export function CompareView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const hydrated = useHydrated();
  const saved = useSavedCities();
  const s = useSettings();
  const [metric, setMetric] = useState<Metric>("max");

  const ids = useMemo(
    () =>
      [...new Set((params.get("cities") ?? "").split(",").map((x) => Number.parseInt(x, 10)).filter((n) => n > 0))].slice(0, MAX),
    [params],
  );
  const { data: lookedUp, isLoading: citiesLoading } = useCities(ids);
  const cities = useMemo(() => (lookedUp ?? []).filter((c): c is City => !!c), [lookedUp]);
  const { data: forecasts } = useForecasts(cities.length ? cities : null);

  const setIds = (next: number[]) => {
    const q = next.length ? `?cities=${next.join(",")}` : "";
    router.replace(`${pathname}${q}`, { scroll: false });
  };
  const add = (c: City) => !ids.includes(c.id) && ids.length < MAX && setIds([...ids, c.id]);
  const remove = (id: number) => setIds(ids.filter((x) => x !== id));

  const ready = cities.length > 0 && !!forecasts && cities.every((c) => forecasts[c.id]);
  const list = ready ? cities.map((c) => forecasts![c.id]) : [];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            <Columns3 className="size-4" /> Compare
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">Side-by-side weather</h1>
          <p className="mt-2 text-muted">Up to {MAX} cities. Their local times, conditions and the week ahead.</p>
        </div>
        <div className="w-full lg:w-96">
          {ids.length < MAX ? (
            <CityCombobox placeholder={`Add a city (${ids.length}/${MAX})…`} onSelect={add} excludeIds={ids} />
          ) : (
            <p className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-muted">Maximum of {MAX} cities. Remove one to add another.</p>
          )}
        </div>
      </header>

      {ids.length === 0 && (
        <div className="card flex flex-col items-center gap-4 px-6 py-14 text-center">
          <div className="flex -space-x-4">
            {["clear-day", "rain", "snow"].map((n) => (
              <Image key={n} src={`/weather-icons/${n}.svg`} alt="" width={72} height={72} unoptimized />
            ))}
          </div>
          <h2 className="text-xl font-semibold">Pick cities to compare</h2>
          <p className="max-w-md text-muted">Search above, or start with your saved cities:</p>
          {hydrated && (
            <div className="flex flex-wrap justify-center gap-2">
              {saved.map((c) => (
                <button key={c.id} onClick={() => add(c)} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-solid px-3 py-1.5 text-sm hover:border-accent/50">
                  <Flag code={c.countryCode} size={12} /> {c.name} <Plus className="size-3.5 text-faint" />
                </button>
              ))}
              {saved.length >= 2 && (
                <button onClick={() => setIds(saved.slice(0, MAX).map((c) => c.id))} className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-white">
                  Compare all saved
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {ids.length > 0 && (
        <div className={`grid gap-4 sm:grid-cols-2 ${ids.length >= 3 ? "lg:grid-cols-4" : ""}`}>
          {(citiesLoading ? ids.map(() => null) : cities).map((c, i) =>
            c ? <CityColumn key={c.id} city={c} fc={forecasts?.[c.id]} color={SERIES[i]} onRemove={() => remove(c.id)} /> : <div key={i} className="skeleton h-56 !rounded-3xl" />,
          )}
        </div>
      )}

      {ready && cities.length > 0 && (
        <>
          <section className="card rise p-5 sm:p-6">
            <SectionTitle
              icon={<LineIcon className="size-4" />}
              action={<Segmented label="Metric" size="sm" value={metric} onChange={setMetric} options={METRICS} />}
            >
              Next 7 days
            </SectionTitle>
            <Legend cities={cities} />
            <WeekChart cities={cities} forecasts={list} metric={metric} settings={s} />
          </section>

          <section className="card rise overflow-hidden">
            <div className="px-5 pt-5 sm:px-6 sm:pt-6">
              <SectionTitle icon={<Table2 className="size-4" />}>Today in detail</SectionTitle>
            </div>
            <CompareTable cities={cities} forecasts={list} settings={s} />
          </section>
        </>
      )}
    </div>
  );
}

function CityColumn({ city, fc, color, onRemove }: { city: City; fc?: Forecast; color: string; onRemove: () => void }) {
  const s = useSettings();
  const now = useNow();
  const cur = fc?.current;
  const isDay = cur ? cur.is_day === 1 : true;
  const info = cur ? weatherInfo(cur.weather_code, isDay) : null;
  const diff = now ? tzOffset(city.timezone, now) - tzOffset(localTz(), now) : null;

  return (
    <div className="rise group relative h-56 overflow-hidden rounded-3xl text-white shadow-xl shadow-slate-900/10">
      {info ? <WeatherScene scene={info.scene} isDay={isDay} density={0.4} /> : <div className="scene skeleton" />}
      <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: color }} />
      <div className="relative flex h-full flex-col justify-between p-5">
        <div className="flex items-start justify-between">
          <Link href={cityHref(city)} className="min-w-0 hover:underline">
            <span className="flex items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-full ring-2 ring-white/70" style={{ background: color }} />
              <span className="truncate text-lg font-semibold drop-shadow">{city.name}</span>
            </span>
            <span className="block truncate text-xs text-white/75">{city.country}</span>
          </Link>
          <button onClick={onRemove} aria-label={`Remove ${city.name}`} className="grid size-7 place-items-center rounded-full bg-black/25 backdrop-blur hover:bg-black/45">
            <X className="size-3.5" />
          </button>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <LiveClock tz={city.timezone} className="text-2xl font-semibold drop-shadow" />
            <p className="text-xs text-white/80">{diff == null ? " " : diff === 0 ? "Your time" : fmtDiff(diff)}</p>
          </div>
          <div className="flex items-center">
            {cur && <WeatherIcon code={cur.weather_code} isDay={isDay} size={56} />}
            <span className="text-4xl font-light tabular">{cur ? fmtTemp(cur.temperature_2m, s) : "—"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Legend({ cities }: { cities: City[] }) {
  return (
    <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
      {cities.map((c, i) => (
        <li key={c.id} className="flex items-center gap-2">
          <span className="h-0.5 w-5 rounded-full" style={{ background: SERIES[i], height: 3 }} />
          {c.name}
        </li>
      ))}
    </ul>
  );
}

function WeekChart({ cities, forecasts, metric, settings }: { cities: City[]; forecasts: Forecast[]; metric: Metric; settings: Settings }) {
  const unit = metricUnit(metric, settings);
  const days = forecasts[0].daily.time.length;
  const data = Array.from({ length: days }, (_, i) => {
    const row: Record<string, number | string | null> = {
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : formatDate(forecasts[0].daily.time[i] * 1000, cities[0].timezone, "weekday"),
    };
    cities.forEach((c, k) => (row[`c${k}`] = metricValue(forecasts[k], i, metric, settings)));
    return row;
  });

  return (
    <div key={metric} className="rise h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "var(--faint)", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: "var(--faint)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={48}
            domain={metric === "rain" ? [0, 100] : ["auto", "auto"]}
            tickFormatter={(v: number) => `${v}${unit === "%" || unit.startsWith("°") ? unit.slice(0, 1) : ""}`}
          />
          <Tooltip
            cursor={{ stroke: "var(--faint)", strokeDasharray: "4 4" }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <div className="rounded-xl border border-line bg-surface-solid px-3 py-2 text-sm shadow-xl">
                  <p className="mb-1 font-semibold">{label}</p>
                  {payload.map((p) => {
                    const k = Number(String(p.dataKey).slice(1));
                    return (
                      <p key={k} className="flex items-center gap-2">
                        <span className="size-2 rounded-full" style={{ background: SERIES[k] }} />
                        <span className="text-muted">{cities[k].name}</span>
                        <span className="ml-auto pl-3 font-semibold tabular">{p.value == null ? "—" : `${p.value} ${unit}`}</span>
                      </p>
                    );
                  })}
                </div>
              ) : null
            }
          />
          {cities.map((c, k) => (
            <Line
              key={c.id}
              dataKey={`c${k}`}
              stroke={SERIES[k]}
              strokeWidth={2}
              dot={{ r: 4, fill: SERIES[k], stroke: "var(--surface-solid)", strokeWidth: 2 }}
              activeDot={{ r: 6, stroke: "var(--surface-solid)", strokeWidth: 2 }}
              type="monotone"
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function CompareTable({ cities, forecasts, settings: s }: { cities: City[]; forecasts: Forecast[]; settings: Settings }) {
  const now = useNow();
  const pick = (vals: number[], dir: 1 | -1) => {
    const best = dir === 1 ? Math.max(...vals) : Math.min(...vals);
    return vals.filter((v) => v === best).length === vals.length ? -1 : vals.indexOf(best);
  };
  const temps = forecasts.map((f) => f.current.temperature_2m);
  const rains = forecasts.map((f) => f.daily.precipitation_probability_max[0] ?? 0);
  const winds = forecasts.map((f) => f.current.wind_speed_10m);
  const daylight = forecasts.map((f) => f.daily.daylight_duration[0]);
  const badges: Record<string, { i: number; text: string }> = {
    temp: { i: pick(temps, 1), text: "Warmest" },
    rain: { i: pick(rains, 1), text: "Wettest" },
    wind: { i: pick(winds, 1), text: "Windiest" },
    day: { i: pick(daylight, 1), text: "Longest day" },
  };

  const rows: { key: string; label: string; cell: (c: City, f: Forecast) => React.ReactNode; badge?: string }[] = [
    { key: "time", label: "Local time", cell: (c) => <LiveClock tz={c.timezone} className="font-semibold" /> },
    { key: "date", label: "Date", cell: (c) => (now ? formatDate(now, c.timezone, "short") : "—") },
    {
      key: "diff",
      label: "Vs. your time",
      cell: (c) => {
        if (!now) return "—";
        const d = tzOffset(c.timezone, now) - tzOffset(localTz(), now);
        return d === 0 ? "Same" : fmtDiff(d);
      },
    },
    {
      key: "cond",
      label: "Conditions",
      cell: (_, f) => (
        <span className="inline-flex items-center gap-1.5">
          <WeatherIcon code={f.current.weather_code} isDay={f.current.is_day === 1} size={32} className="-my-1" />
          {weatherInfo(f.current.weather_code).label}
        </span>
      ),
    },
    { key: "temp", label: "Temperature", badge: "temp", cell: (_, f) => <span className="font-semibold">{fmtTemp(f.current.temperature_2m, s, true)}</span> },
    { key: "feels", label: "Feels like", cell: (_, f) => fmtTemp(f.current.apparent_temperature, s, true) },
    { key: "hl", label: "High / low", cell: (_, f) => `${fmtTemp(f.daily.temperature_2m_max[0], s)} / ${fmtTemp(f.daily.temperature_2m_min[0], s)}` },
    { key: "hum", label: "Humidity", cell: (_, f) => `${f.current.relative_humidity_2m}%` },
    { key: "wind", label: "Wind", badge: "wind", cell: (_, f) => fmtWind(f.current.wind_speed_10m, s) },
    { key: "rain", label: "Chance of rain", badge: "rain", cell: (_, f) => `${f.daily.precipitation_probability_max[0] ?? 0}%` },
    { key: "precip", label: "Precipitation", cell: (_, f) => fmtPrecip(f.daily.precipitation_sum[0] ?? 0, s) },
    { key: "uv", label: "UV index (max)", cell: (_, f) => Math.round(f.daily.uv_index_max[0] ?? 0) },
    { key: "rise", label: "Sunrise", cell: (c, f) => formatTime(f.daily.sunrise[0] * 1000, c.timezone, s.clock) },
    { key: "set", label: "Sunset", cell: (c, f) => formatTime(f.daily.sunset[0] * 1000, c.timezone, s.clock) },
    { key: "day", label: "Daylight", badge: "day", cell: (_, f) => fmtDuration(f.daily.daylight_duration[0]) },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            <th className="sticky left-0 z-10 w-28 bg-surface-solid px-4 py-3 font-medium text-muted sm:w-44 sm:px-6" scope="col">
              <span className="sr-only">Metric</span>
            </th>
            {cities.map((c, i) => (
              <th key={c.id} scope="col" className="px-4 py-3 font-semibold">
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ background: SERIES[i] }} />
                  {c.name}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-line/70 last:border-0 hover:bg-surface-2">
              <th scope="row" className="sticky left-0 z-10 bg-surface-solid px-4 py-3 text-left font-medium text-muted sm:px-6">{r.label}</th>
              {cities.map((c, i) => (
                <td key={c.id} className="px-4 py-3 tabular">
                  <span className="inline-flex flex-wrap items-center gap-2">
                    {r.cell(c, forecasts[i])}
                    {r.badge && badges[r.badge].i === i && (
                      <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent">{badges[r.badge].text}</span>
                    )}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
