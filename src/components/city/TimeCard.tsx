"use client";

import { ArrowRight, Globe2 } from "lucide-react";
import Link from "next/link";
import { useNow } from "@/lib/store";
import { cityZoneToken, fmtDiff, fmtOffset, formatDate, localTz, tzNames, tzOffset } from "@/lib/time";
import type { City } from "@/lib/types";
import { LiveClock } from "../LiveClock";
import { SectionTitle } from "../ui";

export function TimeCard({ city }: { city: City }) {
  const now = useNow();
  const tz = city.timezone;

  let rows: [string, string][] = [];
  let diffText = "";
  if (now) {
    const off = tzOffset(tz, now);
    const year = new Date(now).getUTCFullYear();
    const jan = tzOffset(tz, Date.UTC(year, 0, 15));
    const jul = tzOffset(tz, Date.UTC(year, 6, 15));
    const dst = jan === jul ? "Not observed" : off > Math.min(jan, jul) ? "In effect" : "Not in effect";
    const names = tzNames(tz, now);
    const diff = off - tzOffset(localTz(), now);
    diffText = diff === 0 ? "Same time as you" : `${fmtDiff(diff)} of you`;
    rows = [
      ["Time zone", names.long],
      ["Abbreviation", names.short],
      ["UTC offset", fmtOffset(off)],
      ["IANA zone", tz],
      ["Daylight saving", dst],
    ];
  }

  return (
    <section className="card rise relative overflow-hidden p-5 sm:p-6">
      <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-gradient-to-br from-indigo-500/25 to-cyan-400/10 blur-2xl" />
      <SectionTitle icon={<Globe2 className="size-4" />}>Local time</SectionTitle>
      <LiveClock tz={tz} seconds className="text-5xl font-semibold tracking-tight" />
      <p className="mt-1 text-muted">{now ? formatDate(now, tz, "long") : " "}</p>
      {diffText && <p className="mt-3 inline-flex rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent">{diffText}</p>}

      <dl className="mt-5 space-y-2.5 text-sm">
        {(rows.length ? rows : Array.from({ length: 5 }, () => ["", ""] as [string, string])).map(([k, v], i) => (
          <div key={i} className="flex justify-between gap-4">
            <dt className="text-muted">{k || <span className="skeleton inline-block h-4 w-20" />}</dt>
            <dd className="text-right font-medium">{v || <span className="skeleton inline-block h-4 w-28" />}</dd>
          </div>
        ))}
      </dl>

      <Link
        href={`/time?from=${encodeURIComponent(cityZoneToken(tz, city.name))}`}
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
      >
        Convert {city.name} time <ArrowRight className="size-4" />
      </Link>
    </section>
  );
}
