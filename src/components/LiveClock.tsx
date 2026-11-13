"use client";

import { useNow, useSettings } from "@/lib/store";
import { formatTime } from "@/lib/time";

/** Ticking clock for a timezone. Renders a placeholder until hydrated (no SSR/client mismatch). */
export function LiveClock({ tz, seconds = false, className = "" }: { tz: string; seconds?: boolean; className?: string }) {
  const now = useNow();
  const { clock } = useSettings();
  if (!now) {
    return <span className={`tabular opacity-60 ${className}`}>{seconds ? "--:--:--" : "--:--"}</span>;
  }
  const text = formatTime(now, tz, clock, seconds);
  // Split "10:42:07 PM" into parts so the colons can blink and AM/PM can be smaller.
  const [time, ampm] = text.split(" ");
  const parts = time.split(":");
  return (
    <span className={`tabular ${className}`} suppressHydrationWarning>
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 && <span className="colon">:</span>}
          {p}
        </span>
      ))}
      {ampm && <span className="ml-1 text-[0.45em] font-medium uppercase opacity-80">{ampm}</span>}
    </span>
  );
}
