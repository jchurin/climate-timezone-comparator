"use client";

import { ArrowDownUp, ArrowLeftRight, CalendarClock, Clock3, Plus, Radio, Trash2, Users } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useHydrated, useNow, useSettings } from "@/lib/store";
import {
  dayShift,
  fmtOffset,
  formatZoneDate,
  formatZoneTime,
  fromWallClock,
  parseZone,
  tzNames,
  wallClock,
  zoneOffset,
  type Zone,
} from "@/lib/time";
import { MetaIcon, SectionTitle } from "../ui";
import { ZonePicker } from "./ZonePicker";

const DEFAULT_FROM = "local";
const DEFAULT_TO = ["UTC", "America/New_York@New York", "Europe/London@London", "Asia/Tokyo@Tokyo"];

const PRESETS: { label: string; from: string; to: string[] }[] = [
  { label: "EST → GMT", from: "EST", to: ["GMT"] },
  { label: "PST → CET", from: "PST", to: ["CET"] },
  { label: "IST → EST", from: "IST", to: ["EST"] },
  { label: "UTC → JST", from: "UTC", to: ["JST"] },
  { label: "Your time → world", from: "local", to: DEFAULT_TO },
];

const pad = (n: number) => n.toString().padStart(2, "0");

function diffLabel(min: number) {
  if (min === 0) return "same time";
  const sign = min > 0 ? "+" : "−";
  const abs = Math.abs(min);
  return `${sign}${Math.floor(abs / 60)}h${abs % 60 ? ` ${abs % 60}m` : ""}`;
}

/** Hour of day → friendly band for the meeting planner. */
function band(h: number) {
  if (h >= 9 && h < 18) return { cls: "bg-emerald-400/25 text-emerald-800 dark:text-emerald-200", name: "work" };
  if ((h >= 7 && h < 9) || (h >= 18 && h < 22)) return { cls: "bg-amber-300/25 text-amber-800 dark:text-amber-200", name: "early/evening" };
  return { cls: "bg-indigo-500/15 text-indigo-800 dark:text-indigo-200", name: "night" };
}

export function TimeConverter() {
  const hydrated = useHydrated();
  if (!hydrated) return <div className="skeleton h-[560px] !rounded-3xl" />;
  return <Converter />;
}

function Converter() {
  const params = useSearchParams();
  const settings = useSettings();
  const now = useNow();

  // Initial state comes from the URL (shareable); afterwards the URL mirrors the state.
  const [fromToken, setFromToken] = useState(() => (params.get("from") && parseZone(params.get("from")!) ? params.get("from")! : DEFAULT_FROM));
  const [toTokens, setToTokens] = useState<string[]>(() => {
    const raw = params.get("to");
    const list = raw ? raw.split(",").filter((t) => parseZone(t)) : params.get("from") ? ["local", "UTC"] : DEFAULT_TO;
    return list.length ? list : DEFAULT_TO;
  });
  const [fixedAt, setFixedAt] = useState<number | null>(() => {
    const t = Number(params.get("t"));
    return t > 0 ? t : null;
  });
  const [picker, setPicker] = useState<null | "from" | "add">(null);

  const from = useMemo(() => parseZone(fromToken)!, [fromToken]);
  const targets = useMemo(() => toTokens.map(parseZone).filter((z): z is Zone => !!z && z.token !== fromToken), [toTokens, fromToken]);
  const at = fixedAt ?? now;
  const live = fixedAt == null;

  useEffect(() => {
    const qs = new URLSearchParams();
    qs.set("from", fromToken);
    qs.set("to", toTokens.join(","));
    if (fixedAt) qs.set("t", String(fixedAt));
    window.history.replaceState(null, "", `?${qs.toString().replace(/%2F/g, "/").replace(/%40/g, "@").replace(/%2C/g, ",")}`);
  }, [fromToken, toTokens, fixedAt]);

  const w = wallClock(from, at);
  const dateValue = `${w.year}-${pad(w.month + 1)}-${pad(w.day)}`;
  const timeValue = `${pad(w.hour)}:${pad(w.minute)}`;
  const minutes = w.hour * 60 + w.minute;

  const setWall = (y: number, mo: number, d: number, h: number, mi: number) => setFixedAt(fromWallClock(from, y, mo, d, h, mi));

  const swap = (z: Zone) => {
    setToTokens((list) => [fromToken, ...list.filter((t) => t !== z.token)]);
    setFromToken(z.token);
  };

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    setFromToken(p.from);
    setToTokens(p.to);
  };

  const fromNames = from.tz ? tzNames(from.tz, at) : null;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            <ArrowLeftRight className="size-4" /> Time converter
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">Convert time across zones</h1>
          <p className="mt-2 text-muted">Cities, IANA zones or abbreviations. Daylight saving is handled for city and IANA zones.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button key={p.label} onClick={() => applyPreset(p)} className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium transition hover:border-accent/50 hover:text-accent">
              {p.label}
            </button>
          ))}
        </div>
      </header>

      {/* Source */}
      <section className="rise relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-6 text-white shadow-2xl shadow-indigo-600/25 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-white/10 blur-2xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-white/70">From</p>
            <button onClick={() => setPicker("from")} className="group mt-1 text-left">
              <span className="text-3xl font-semibold underline decoration-white/30 decoration-2 underline-offset-8 group-hover:decoration-white sm:text-4xl">{from.label}</span>
              <span className="mt-2 block text-sm text-white/75">
                {from.fixed != null ? from.detail : `${fromNames?.long} · ${fmtOffset(zoneOffset(from, at))} · ${from.tz}`}
              </span>
            </button>
            <p className="mt-6 text-6xl font-semibold tracking-tight tabular sm:text-7xl">{formatZoneTime(from, at, settings.clock)}</p>
            <p className="mt-1 text-white/80">{formatZoneDate(from, at, "long")}</p>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur">
            <div className="flex gap-2">
              <label className="flex flex-col text-xs font-medium text-white/75">
                Date
                <input
                  type="date"
                  value={dateValue}
                  onChange={(e) => {
                    const [y, m, d] = e.target.value.split("-").map(Number);
                    if (y && m && d) setWall(y, m - 1, d, w.hour, w.minute);
                  }}
                  className="mt-1 rounded-xl bg-white/90 px-3 py-2 text-base text-slate-900 outline-none [color-scheme:light]"
                />
              </label>
              <label className="flex flex-col text-xs font-medium text-white/75">
                Time
                <input
                  type="time"
                  value={timeValue}
                  onChange={(e) => {
                    const [h, mi] = e.target.value.split(":").map(Number);
                    if (Number.isFinite(h) && Number.isFinite(mi)) setWall(w.year, w.month, w.day, h, mi);
                  }}
                  className="mt-1 rounded-xl bg-white/90 px-3 py-2 text-base text-slate-900 outline-none [color-scheme:light]"
                />
              </label>
            </div>
            <button
              onClick={() => setFixedAt(null)}
              disabled={live}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${live ? "bg-emerald-400/20 text-emerald-100" : "bg-white text-indigo-700 hover:bg-white/90"}`}
            >
              <Radio className={`size-4 ${live ? "animate-pulse" : ""}`} />
              {live ? "Live: following current time" : "Back to now"}
            </button>
          </div>
        </div>

        {/* Time-of-day slider */}
        <div className="relative mt-6">
          <input
            type="range"
            min={0}
            max={1439}
            step={15}
            value={minutes}
            aria-label="Time of day"
            onChange={(e) => {
              const v = Number(e.target.value);
              setWall(w.year, w.month, w.day, Math.floor(v / 60), v % 60);
            }}
            className="w-full cursor-pointer accent-white"
          />
          <div className="mt-1 flex justify-between text-[11px] text-white/60 tabular">
            {["00", "06", "12", "18", "24"].map((h) => (
              <span key={h}>{h}:00</span>
            ))}
          </div>
        </div>
      </section>

      {/* Targets */}
      <section>
        <SectionTitle
          icon={<Clock3 className="size-4" />}
          action={
            <button onClick={() => setPicker("add")} className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20">
              <Plus className="size-4" /> Add zone
            </button>
          }
        >
          Converted
        </SectionTitle>
        <div className="grid gap-4 md:grid-cols-2">
          {targets.map((z, i) => {
            const zw = wallClock(z, at);
            const diff = zoneOffset(z, at) - zoneOffset(from, at);
            const shift = dayShift(from, z, at);
            const isDay = zw.hour >= 6 && zw.hour < 18;
            const names = z.tz ? tzNames(z.tz, at) : null;
            return (
              <article key={z.token} className="card rise group flex items-center gap-4 p-5" style={{ animationDelay: `${i * 50}ms` }}>
                <MetaIcon name={isDay ? "clear-day" : "clear-night"} size={56} alt={isDay ? "Daytime" : "Night"} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-lg font-semibold">{z.label}</h3>
                    <span className="shrink-0 rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] font-semibold text-muted">
                      {z.fixed != null ? z.token : names?.short}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted">{z.fixed != null ? z.detail : `${names?.long} · ${fmtOffset(zoneOffset(z, at))}`}</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight tabular">{formatZoneTime(z, at, settings.clock)}</p>
                  <p className="text-sm text-muted">
                    {formatZoneDate(z, at)}
                    {shift !== 0 && (
                      <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${shift > 0 ? "bg-amber-400/20 text-amber-700 dark:text-amber-300" : "bg-sky-400/20 text-sky-700 dark:text-sky-300"}`}>
                        {shift > 0 ? "Next day" : "Previous day"}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent tabular">{diffLabel(diff)}</span>
                  <div className="flex gap-1 opacity-70 transition group-hover:opacity-100">
                    <button onClick={() => swap(z)} title="Use as source" aria-label={`Use ${z.label} as source`} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink">
                      <ArrowDownUp className="size-4" />
                    </button>
                    <button onClick={() => setToTokens((l) => l.filter((t) => t !== z.token))} title="Remove" aria-label={`Remove ${z.label}`} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-rose-500/10 hover:text-rose-500">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
          {targets.length === 0 && (
            <button onClick={() => setPicker("add")} className="card flex items-center justify-center gap-2 p-8 text-muted hover:text-accent md:col-span-2">
              <Plus className="size-5" /> Add a zone to convert to
            </button>
          )}
        </div>
      </section>

      {/* Meeting planner */}
      {targets.length > 0 && (
        <section className="card rise p-5 sm:p-6">
          <SectionTitle icon={<Users className="size-4" />}>Meeting planner</SectionTitle>
          <p className="-mt-2 mb-4 text-sm text-muted">
            Each column is one hour of {from.label}&apos;s day. Click a column to pick that time. Columns where everyone is in working hours are marked.
          </p>
          <Planner from={from} zones={targets} clock={settings.clock} onPick={(h) => setWall(w.year, w.month, w.day, h, 0)} selectedHour={w.hour} wall={w} />
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted">
            {[{ h: 10, l: "Working hours (9–18)" }, { h: 20, l: "Early / evening" }, { h: 2, l: "Night" }].map(({ h, l }) => (
              <span key={l} className="flex items-center gap-1.5">
                <span className={`size-3 rounded ${band(h).cls}`} /> {l}
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded ring-2 ring-emerald-500" /> Everyone in working hours
            </span>
          </div>
        </section>
      )}

      {picker && (
        <ZonePicker
          title={picker === "from" ? "Convert from…" : "Add a time zone"}
          onClose={() => setPicker(null)}
          onSelect={(token) => {
            if (picker === "from") {
              setToTokens((l) => (l.includes(fromToken) || fromToken === token ? l.filter((t) => t !== token) : [fromToken, ...l.filter((t) => t !== token)]));
              setFromToken(token);
            } else if (!toTokens.includes(token) && token !== fromToken) {
              setToTokens((l) => [...l, token]);
            }
            setPicker(null);
          }}
        />
      )}

      <p className="flex items-center justify-center gap-1.5 text-xs text-faint">
        <CalendarClock className="size-3.5" /> The URL updates as you go. Share it to send this exact conversion.
      </p>
    </div>
  );
}

function Planner({
  from,
  zones,
  clock,
  onPick,
  selectedHour,
  wall,
}: {
  from: Zone;
  zones: Zone[];
  clock: "12" | "24";
  onPick: (hour: number) => void;
  selectedHour: number;
  wall: ReturnType<typeof wallClock>;
}) {
  const rows = [from, ...zones];
  const hours = Array.from({ length: 24 }, (_, h) => fromWallClock(from, wall.year, wall.month, wall.day, h, 0));
  const fmtH = (h: number) => (clock === "24" ? pad(h) : `${h % 12 || 12}${h < 12 ? "a" : "p"}`);
  const allWork = hours.map((instant) => rows.every((z) => band(wallClock(z, instant).hour).name === "work"));

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-x-0.5 border-spacing-y-1 text-center text-xs">
        <tbody>
          {rows.map((z, r) => (
            <tr key={z.token}>
              <th scope="row" className="sticky left-0 z-10 min-w-28 bg-surface-solid pr-3 text-left text-sm font-medium">
                <span className="block truncate">{z.label}</span>
                {r === 0 && <span className="block text-[10px] font-normal text-faint">source</span>}
              </th>
              {hours.map((instant, h) => {
                const lh = wallClock(z, instant).hour;
                const lm = wallClock(z, instant).minute;
                const b = band(lh);
                const selected = h === selectedHour;
                return (
                  <td key={h} className="p-0">
                    <button
                      onClick={() => onPick(h)}
                      title={`${z.label}: ${pad(lh)}:${pad(lm)}`}
                      className={`h-9 w-full min-w-9 rounded-md font-medium tabular transition ${b.cls} ${
                        selected ? "!bg-accent !text-white shadow-md" : "hover:brightness-110"
                      } ${allWork[h] && !selected ? "ring-2 ring-inset ring-emerald-500" : ""}`}
                    >
                      {fmtH(lh)}
                      {lm ? <sup className="text-[8px]">{lm}</sup> : null}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
