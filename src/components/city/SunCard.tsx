"use client";

import { Sunrise } from "lucide-react";
import { useNow, useSettings } from "@/lib/store";
import { formatTime } from "@/lib/time";
import type { Forecast } from "@/lib/types";
import { fmtDuration } from "@/lib/units";
import { MetaIcon, SectionTitle } from "../ui";

export function SunCard({ fc, tz }: { fc: Forecast; tz: string }) {
  const s = useSettings();
  const now = useNow();
  const rise = fc.daily.sunrise[0] * 1000;
  const set = fc.daily.sunset[0] * 1000;
  const polar = !rise || !set || rise === set;
  const t = now ? Math.min(1, Math.max(0, (now - rise) / (set - rise))) : 0.5;
  const daytime = !!now && now >= rise && now <= set;

  // Semi-ellipse from (20,100) to (280,100), apex at y=20.
  const angle = Math.PI * (1 - t);
  const x = 150 + 130 * Math.cos(angle);
  const y = 100 - 80 * Math.sin(angle);

  let caption = "";
  if (now && !polar) {
    if (now < rise) caption = `Sunrise in ${fmtDuration((rise - now) / 1000)}`;
    else if (now <= set) caption = `Sunset in ${fmtDuration((set - now) / 1000)}`;
    else {
      const nextRise = fc.daily.sunrise[1] * 1000;
      caption = nextRise ? `Sunrise in ${fmtDuration((nextRise - now) / 1000)}` : "The sun has set";
    }
  }

  return (
    <section className="card rise p-5 sm:p-6">
      <SectionTitle icon={<Sunrise className="size-4" />}>Sun</SectionTitle>
      <svg viewBox="0 0 300 116" className="w-full" aria-hidden>
        <defs>
          <linearGradient id="arc" x1="0" x2="1">
            <stop offset="0" stopColor="#fb923c" />
            <stop offset="0.5" stopColor="#facc15" />
            <stop offset="1" stopColor="#f472b6" />
          </linearGradient>
          <radialGradient id="sun">
            <stop offset="0" stopColor="#fde68a" />
            <stop offset="1" stopColor="#f59e0b" />
          </radialGradient>
        </defs>
        <line x1="8" y1="100" x2="292" y2="100" stroke="var(--border)" strokeWidth="1.5" />
        <path d="M20,100 A130,80 0 0 1 280,100" fill="none" stroke="var(--border)" strokeWidth="2" strokeDasharray="4 5" />
        {daytime && (
          <path
            d={`M20,100 A130,80 0 0 1 ${x.toFixed(1)},${y.toFixed(1)}`}
            fill="none"
            stroke="url(#arc)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}
        {daytime ? (
          <>
            <circle cx={x} cy={y} r="14" fill="#facc15" opacity="0.25" />
            <circle cx={x} cy={y} r="8" fill="url(#sun)" />
          </>
        ) : (
          <circle cx="150" cy="100" r="6" fill="var(--faint)" opacity="0.6" />
        )}
      </svg>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <MetaIcon name="sunrise" size={44} />
          <div>
            <p className="text-xs text-muted">Sunrise</p>
            <p className="font-semibold tabular">{polar ? "—" : formatTime(rise, tz, s.clock)}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 text-right">
          <div>
            <p className="text-xs text-muted">Sunset</p>
            <p className="font-semibold tabular">{polar ? "—" : formatTime(set, tz, s.clock)}</p>
          </div>
          <MetaIcon name="sunset" size={44} />
        </div>
      </div>
      <p className="mt-3 text-center text-sm text-muted">
        Daylight {fmtDuration(fc.daily.daylight_duration[0])}
        {caption && <> · <span className="font-medium text-ink">{caption}</span></>}
      </p>
    </section>
  );
}
