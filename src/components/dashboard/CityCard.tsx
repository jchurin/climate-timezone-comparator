"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { cityHref } from "@/lib/api";
import { useNow, useSettings } from "@/lib/store";
import { formatDate, fmtDiff, localTz, tzNames, tzOffset } from "@/lib/time";
import type { City, Forecast } from "@/lib/types";
import { fmtTemp } from "@/lib/units";
import { weatherInfo } from "@/lib/weather-codes";
import { LiveClock } from "../LiveClock";
import { Flag, WeatherIcon } from "../ui";
import { WeatherScene } from "../WeatherScene";

export function CityCard({ city, forecast, onRemove, index = 0 }: { city: City; forecast?: Forecast; onRemove?: () => void; index?: number }) {
  const s = useSettings();
  const now = useNow();
  const cur = forecast?.current;
  const info = cur ? weatherInfo(cur.weather_code, cur.is_day === 1) : null;
  const isDay = cur ? cur.is_day === 1 : true;
  const diff = now ? tzOffset(city.timezone, now) - tzOffset(localTz(), now) : null;

  return (
    <div className="rise group relative" style={{ animationDelay: `${index * 60}ms` }}>
      <Link
        href={cityHref(city)}
        className="relative block h-[232px] overflow-hidden rounded-3xl text-white shadow-xl shadow-slate-900/10 ring-1 ring-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
      >
        {info ? <WeatherScene scene={info.scene} isDay={isDay} density={0.5} /> : <div className="scene skeleton !rounded-none" />}

        <div className="relative flex h-full flex-col justify-between p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Flag code={city.countryCode} size={14} />
                <h3 className="truncate text-lg font-semibold drop-shadow">{city.name}</h3>
              </div>
              <p className="mt-0.5 truncate text-xs text-white/75">{[city.admin1, city.country].filter(Boolean).join(", ")}</p>
            </div>
            {cur && <WeatherIcon code={cur.weather_code} isDay={isDay} size={64} className="-mr-2 -mt-2 drop-shadow-lg" />}
          </div>

          <div className="flex items-end justify-between gap-3">
            <div>
              <LiveClock tz={city.timezone} className="text-3xl font-semibold tracking-tight drop-shadow" />
              <p className="mt-0.5 text-xs text-white/80">
                {now ? (
                  <>
                    {formatDate(now, city.timezone, "short")} · {tzNames(city.timezone, now).short}
                    {diff != null && diff !== 0 && <span className="text-white/60"> · {fmtDiff(diff)}</span>}
                  </>
                ) : (
                  " "
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-5xl font-light leading-none tracking-tighter drop-shadow tabular">{cur ? fmtTemp(cur.temperature_2m, s) : "—"}</p>
              <p className="mt-1 text-xs text-white/85">
                {info?.label ?? "Loading…"}
                {forecast && (
                  <span className="text-white/65">
                    {" "}· H {fmtTemp(forecast.daily.temperature_2m_max[0], s)} L {fmtTemp(forecast.daily.temperature_2m_min[0], s)}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </Link>

      {onRemove && (
        <button
          onClick={onRemove}
          aria-label={`Remove ${city.name}`}
          className="absolute right-3 top-3 z-10 grid size-7 place-items-center rounded-full bg-black/30 text-white opacity-0 backdrop-blur transition hover:bg-black/50 focus:opacity-100 group-hover:opacity-100"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
