"use client";

import { Gauge, Navigation } from "lucide-react";
import { useSettings } from "@/lib/store";
import type { Forecast } from "@/lib/types";
import { fmtDistance, fmtPrecip, fmtPressure, fmtTemp, fmtWind } from "@/lib/units";
import { compassPoint, uvLevel } from "@/lib/weather-codes";
import { MetaIcon, SectionTitle } from "../ui";

export function Details({ fc }: { fc: Forecast }) {
  const s = useSettings();
  const c = fc.current;
  const uv = Math.round(c.uv_index ?? 0);
  const uvMax = fc.daily.uv_index_max[0] ?? 0;

  const feels = c.apparent_temperature - c.temperature_2m;

  return (
    <section>
      <SectionTitle icon={<Gauge className="size-4" />}>Conditions</SectionTitle>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Tile icon="thermometer" title="Feels like" value={fmtTemp(c.apparent_temperature, s)}>
          {Math.abs(feels) < 1 ? "Similar to the actual temperature" : feels > 0 ? "Feels warmer than it is" : "Wind makes it feel colder"}
        </Tile>
        <Tile icon="humidity" title="Humidity" value={`${c.relative_humidity_2m}%`}>
          <Bar value={c.relative_humidity_2m} max={100} className="from-sky-300 to-blue-600" />
        </Tile>
        <Tile icon="wind" title="Wind" value={fmtWind(c.wind_speed_10m, s)}>
          <span className="flex items-center gap-1.5">
            <Navigation className="size-3.5 text-accent" style={{ transform: `rotate(${c.wind_direction_10m + 180}deg)` }} />
            From {compassPoint(c.wind_direction_10m)} · gusts {fmtWind(c.wind_gusts_10m, s)}
          </span>
        </Tile>
        <Tile icon={`uv-index-${Math.min(11, Math.max(1, uv || 1))}`} title="UV index" value={`${uv} · ${uvLevel(uv)}`}>
          <span className="relative block h-1.5 rounded-full bg-gradient-to-r from-green-400 via-yellow-400 via-50% to-fuchsia-600">
            <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface-solid bg-ink" style={{ left: `${Math.min(100, (uv / 11) * 100)}%` }} />
          </span>
          <span className="mt-1.5 block">Peak today {Math.round(uvMax)}</span>
        </Tile>
        <Tile icon={c.pressure_msl >= 1013 ? "pressure-high" : "pressure-low"} title="Pressure" value={fmtPressure(c.pressure_msl, s)}>
          {c.pressure_msl >= 1020 ? "High: usually settled" : c.pressure_msl <= 1005 ? "Low: unsettled weather" : "Near average"}
        </Tile>
        <Tile icon="mist" title="Visibility" value={fmtDistance(c.visibility, s)}>
          {c.visibility >= 10000 ? "Clear view" : c.visibility >= 4000 ? "Moderate" : "Poor visibility"}
        </Tile>
        <Tile icon="cloudy" title="Cloud cover" value={`${c.cloud_cover}%`}>
          <Bar value={c.cloud_cover} max={100} className="from-slate-300 to-slate-500" />
        </Tile>
        <Tile icon="raindrops" title="Precipitation" value={fmtPrecip(fc.daily.precipitation_sum[0] ?? 0, s)}>
          Expected today · {fc.daily.precipitation_probability_max[0] ?? 0}% chance
        </Tile>
      </div>
    </section>
  );
}

function Tile({ icon, title, value, children }: { icon: string; title: string; value: string; children: React.ReactNode }) {
  return (
    <div className="card rise flex flex-col gap-2 p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">{title}</p>
        <MetaIcon name={icon} size={40} className="-my-2 -mr-2" />
      </div>
      <p className="text-2xl font-semibold tabular">{value}</p>
      <div className="text-xs text-muted">{children}</div>
    </div>
  );
}

function Bar({ value, max, className }: { value: number; max: number; className: string }) {
  return (
    <span className="block h-1.5 overflow-hidden rounded-full bg-surface-2">
      <span className={`block h-full rounded-full bg-gradient-to-r ${className}`} style={{ width: `${(value / max) * 100}%` }} />
    </span>
  );
}
