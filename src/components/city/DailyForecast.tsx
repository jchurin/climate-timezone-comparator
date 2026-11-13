"use client";

import { CalendarDays } from "lucide-react";
import { useSettings } from "@/lib/store";
import { formatDate } from "@/lib/time";
import type { Forecast } from "@/lib/types";
import { fmtTemp } from "@/lib/units";
import { weatherInfo } from "@/lib/weather-codes";
import { SectionTitle, WeatherIcon } from "../ui";

/** Temperature (°C) → color along a cold→hot ramp, used for the range bars. */
function tempColor(c: number) {
  const stops: [number, string][] = [[-10, "#818cf8"], [0, "#38bdf8"], [10, "#2dd4bf"], [18, "#a3e635"], [25, "#facc15"], [32, "#fb923c"], [40, "#ef4444"]];
  for (let i = stops.length - 1; i >= 0; i--) if (c >= stops[i][0]) return stops[i][1];
  return stops[0][1];
}

export function DailyForecast({ fc, tz }: { fc: Forecast; tz: string }) {
  const s = useSettings();
  const d = fc.daily;
  const lo = Math.min(...d.temperature_2m_min);
  const hi = Math.max(...d.temperature_2m_max);
  const pct = (v: number) => ((v - lo) / (hi - lo || 1)) * 100;

  return (
    <section className="card rise p-5 sm:p-6">
      <SectionTitle icon={<CalendarDays className="size-4" />}>7-day forecast</SectionTitle>
      <ul className="divide-y divide-line">
        {d.time.map((t, i) => {
          const min = d.temperature_2m_min[i];
          const max = d.temperature_2m_max[i];
          const rain = d.precipitation_probability_max[i];
          const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : formatDate(t * 1000, tz, "weekday");
          return (
            <li key={t} className="grid grid-cols-[5.5rem_2.75rem_3rem_2.75rem_1fr_2.75rem] items-center gap-2 py-2.5 sm:grid-cols-[7rem_3rem_3.5rem_3rem_1fr_3rem]">
              <span className="font-medium">
                {label}
                <span className="block text-xs font-normal text-faint">{formatDate(t * 1000, tz, "short").split(", ").slice(1).join(", ")}</span>
              </span>
              <WeatherIcon code={d.weather_code[i]} size={40} />
              <span className="text-xs font-medium text-sky-600 dark:text-sky-300" title="Chance of precipitation">
                {rain != null && rain >= 10 ? `☔ ${rain}%` : ""}
              </span>
              <span className="text-right text-muted tabular">{fmtTemp(min, s)}</span>
              <span className="relative h-1.5 rounded-full bg-surface-2" title={weatherInfo(d.weather_code[i]).label}>
                <span
                  className="absolute inset-y-0 rounded-full"
                  style={{
                    left: `${pct(min)}%`,
                    right: `${100 - pct(max)}%`,
                    background: `linear-gradient(90deg, ${tempColor(min)}, ${tempColor(max)})`,
                  }}
                />
                {i === 0 && (
                  <span
                    className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface-solid bg-ink"
                    style={{ left: `${Math.min(100, Math.max(0, pct(fc.current.temperature_2m)))}%` }}
                    title="Now"
                  />
                )}
              </span>
              <span className="font-semibold tabular">{fmtTemp(max, s)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
