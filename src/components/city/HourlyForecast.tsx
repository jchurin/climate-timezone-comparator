"use client";

import { Clock } from "lucide-react";
import { useSettings } from "@/lib/store";
import { formatHour } from "@/lib/time";
import type { Forecast } from "@/lib/types";
import { fmtTemp, temp } from "@/lib/units";
import { SectionTitle, WeatherIcon } from "../ui";

const CELL = 72;
const LINE_H = 56;

export function HourlyForecast({ fc, tz }: { fc: Forecast; tz: string }) {
  const s = useSettings();
  const h = fc.hourly;
  // First hour slot that contains "now" (API time = current observation time).
  const start = Math.max(0, h.time.findIndex((t) => t > fc.current.time - 3600));
  const idx = Array.from({ length: 25 }, (_, i) => start + i).filter((i) => i < h.time.length);

  const temps = idx.map((i) => temp(h.temperature_2m[i], s));
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const y = (v: number) => 8 + (1 - (v - min) / (max - min || 1)) * (LINE_H - 16);
  const width = idx.length * CELL;
  const pts = temps.map((v, k) => [k * CELL + CELL / 2, y(v)] as const);
  // Smooth path through points (Catmull-Rom → Bézier).
  const path = pts
    .map((p, k) => {
      if (k === 0) return `M${p[0]},${p[1]}`;
      const p0 = pts[k - 2] ?? pts[k - 1];
      const p1 = pts[k - 1];
      const p3 = pts[k + 1] ?? p;
      const c1 = [p1[0] + (p[0] - p0[0]) / 6, p1[1] + (p[1] - p0[1]) / 6];
      const c2 = [p[0] - (p3[0] - p1[0]) / 6, p[1] - (p3[1] - p1[1]) / 6];
      return `C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p[0]},${p[1]}`;
    })
    .join("");

  return (
    <section className="card rise overflow-hidden p-5 sm:p-6">
      <SectionTitle icon={<Clock className="size-4" />}>Next 24 hours</SectionTitle>
      <div className="no-scrollbar -mx-2 overflow-x-auto">
        <div className="relative px-2" style={{ width: width + 16 }}>
          <svg width={width} height={LINE_H} className="block overflow-visible" aria-hidden>
            <defs>
              <linearGradient id="hourly-line" x1="0" x2="1">
                <stop offset="0" stopColor="var(--accent)" />
                <stop offset="1" stopColor="var(--accent-2)" />
              </linearGradient>
              <linearGradient id="hourly-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="var(--accent)" stopOpacity="0.18" />
                <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`${path}L${pts.at(-1)![0]},${LINE_H}L${pts[0][0]},${LINE_H}Z`} fill="url(#hourly-fill)" />
            <path d={path} fill="none" stroke="url(#hourly-line)" strokeWidth="2.5" strokeLinecap="round" />
            {pts.map(([x, py], k) => (
              <circle key={k} cx={x} cy={py} r={k === 0 ? 5 : 3} fill="var(--surface-solid)" stroke="var(--accent)" strokeWidth="2" />
            ))}
          </svg>
          <ol className="flex">
            {idx.map((i, k) => {
              const rain = h.precipitation_probability[i];
              return (
                <li key={h.time[i]} className={`flex shrink-0 flex-col items-center gap-1 rounded-2xl py-2 ${k === 0 ? "bg-accent-soft" : ""}`} style={{ width: CELL }}>
                  <span className="text-base font-semibold tabular">{fmtTemp(h.temperature_2m[i], s)}</span>
                  <WeatherIcon code={h.weather_code[i]} isDay={h.is_day[i] === 1} size={44} />
                  <span className="h-4 text-[11px] font-medium text-sky-600 dark:text-sky-300">{rain != null && rain >= 10 ? `${rain}%` : ""}</span>
                  <span className={`text-xs tabular ${k === 0 ? "font-semibold text-accent" : "text-muted"}`}>
                    {k === 0 ? "Now" : formatHour(h.time[i] * 1000, tz, s.clock)}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
