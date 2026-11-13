/* Timezone math built on Intl, so it follows DST rules for any IANA zone. */

const offsetFmt = new Map<string, Intl.DateTimeFormat>();

/** UTC offset in minutes for an IANA zone at a given instant (e.g. New York in winter → -300). */
export function tzOffset(tz: string, at: number): number {
  let f = offsetFmt.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "longOffset" });
    offsetFmt.set(tz, f);
  }
  const name = f.formatToParts(at).find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const m = /GMT([+-])(\d{2}):?(\d{2})?/.exec(name);
  if (!m) return 0;
  return (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0));
}

export function isValidTz(tz: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function fmtOffset(minutes: number) {
  const sign = minutes < 0 ? "−" : "+";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `UTC${sign}${h}${m ? `:${m.toString().padStart(2, "0")}` : ""}`;
}

export function fmtDiff(minutes: number) {
  if (minutes === 0) return "same time";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const amount = `${h ? `${h}h` : ""}${m ? `${h ? " " : ""}${m}m` : ""}`;
  return `${amount} ${minutes > 0 ? "ahead" : "behind"}`;
}

/** Long and short zone names, e.g. "Eastern Standard Time" / "EST". */
export function tzNames(tz: string, at: number) {
  const get = (style: "long" | "short") =>
    new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: style })
      .formatToParts(at)
      .find((p) => p.type === "timeZoneName")?.value ?? "";
  return { long: get("long"), short: get("short") };
}

export function localTz() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/* ------------------------------- Zones ------------------------------- */

/** A zone is either an IANA zone (follows DST) or a fixed-offset abbreviation. */
export type Zone = { token: string; label: string; detail: string; tz?: string; fixed?: number };

export const ABBREVIATIONS: { code: string; name: string; offset: number }[] = [
  { code: "UTC", name: "Coordinated Universal Time", offset: 0 },
  { code: "GMT", name: "Greenwich Mean Time", offset: 0 },
  { code: "BST", name: "British Summer Time", offset: 60 },
  { code: "WET", name: "Western European Time", offset: 0 },
  { code: "CET", name: "Central European Time", offset: 60 },
  { code: "CEST", name: "Central European Summer Time", offset: 120 },
  { code: "EET", name: "Eastern European Time", offset: 120 },
  { code: "EEST", name: "Eastern European Summer Time", offset: 180 },
  { code: "WAT", name: "West Africa Time", offset: 60 },
  { code: "CAT", name: "Central Africa Time", offset: 120 },
  { code: "SAST", name: "South Africa Standard Time", offset: 120 },
  { code: "EAT", name: "East Africa Time", offset: 180 },
  { code: "MSK", name: "Moscow Standard Time", offset: 180 },
  { code: "GST", name: "Gulf Standard Time", offset: 240 },
  { code: "PKT", name: "Pakistan Standard Time", offset: 300 },
  { code: "IST", name: "India Standard Time", offset: 330 },
  { code: "NPT", name: "Nepal Time", offset: 345 },
  { code: "ICT", name: "Indochina Time", offset: 420 },
  { code: "SGT", name: "Singapore Time", offset: 480 },
  { code: "HKT", name: "Hong Kong Time", offset: 480 },
  { code: "AWST", name: "Australian Western Standard Time", offset: 480 },
  { code: "JST", name: "Japan Standard Time", offset: 540 },
  { code: "KST", name: "Korea Standard Time", offset: 540 },
  { code: "ACST", name: "Australian Central Standard Time", offset: 570 },
  { code: "AEST", name: "Australian Eastern Standard Time", offset: 600 },
  { code: "AEDT", name: "Australian Eastern Daylight Time", offset: 660 },
  { code: "NZST", name: "New Zealand Standard Time", offset: 720 },
  { code: "NZDT", name: "New Zealand Daylight Time", offset: 780 },
  { code: "HST", name: "Hawaii Standard Time", offset: -600 },
  { code: "AKST", name: "Alaska Standard Time", offset: -540 },
  { code: "AKDT", name: "Alaska Daylight Time", offset: -480 },
  { code: "PST", name: "Pacific Standard Time", offset: -480 },
  { code: "PDT", name: "Pacific Daylight Time", offset: -420 },
  { code: "MST", name: "Mountain Standard Time", offset: -420 },
  { code: "MDT", name: "Mountain Daylight Time", offset: -360 },
  { code: "CST", name: "Central Standard Time (US)", offset: -360 },
  { code: "CDT", name: "Central Daylight Time (US)", offset: -300 },
  { code: "EST", name: "Eastern Standard Time", offset: -300 },
  { code: "EDT", name: "Eastern Daylight Time", offset: -240 },
  { code: "AST", name: "Atlantic Standard Time", offset: -240 },
  { code: "NST", name: "Newfoundland Standard Time", offset: -210 },
  { code: "ART", name: "Argentina Time", offset: -180 },
  { code: "BRT", name: "Brasília Time", offset: -180 },
];

export function tzCityName(tz: string) {
  return (tz.split("/").pop() ?? tz).replace(/_/g, " ");
}

/**
 * URL tokens:
 *  - "EST"                       fixed abbreviation
 *  - "Europe/London"             IANA zone
 *  - "Europe/London@London, UK"  IANA zone with a custom (city) label
 *  - "local"                     the viewer's own zone (client only)
 */
export function parseZone(token: string): Zone | null {
  if (token === "local") {
    const tz = localTz();
    return { token, tz, label: "Your time", detail: `${tzCityName(tz)} · ${tz}` };
  }
  const abbr = ABBREVIATIONS.find((a) => a.code === token.toUpperCase());
  if (abbr) {
    return { token: abbr.code, label: abbr.code, detail: `${abbr.name} · ${fmtOffset(abbr.offset)}`, fixed: abbr.offset };
  }
  const [tz, custom] = token.split("@");
  if (!isValidTz(tz)) return null;
  return { token, tz, label: custom || tzCityName(tz), detail: tz };
}

export function cityZoneToken(tz: string, label: string) {
  return `${tz}@${label}`;
}

export function zoneOffset(z: Zone, at: number) {
  return z.fixed ?? tzOffset(z.tz!, at);
}

/** Wall-clock parts of an instant in a zone. */
export function wallClock(z: Zone, at: number) {
  const d = new Date(at + zoneOffset(z, at) * 60_000);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth(),
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    weekday: d.getUTCDay(),
    /** Same instant shifted so its UTC fields read as local wall time. */
    shifted: d,
  };
}

/** Instant (UTC ms) for a wall-clock time in a zone. Handles DST via two refinement passes. */
export function fromWallClock(z: Zone, y: number, mo: number, d: number, h: number, mi: number) {
  const wall = Date.UTC(y, mo, d, h, mi);
  if (z.fixed != null) return wall - z.fixed * 60_000;
  let guess = wall - tzOffset(z.tz!, wall) * 60_000;
  guess = wall - tzOffset(z.tz!, guess) * 60_000;
  return guess;
}

/** Days between the wall-clock dates of two zones at the same instant (-1, 0, +1). */
export function dayShift(a: Zone, b: Zone, at: number) {
  const wa = wallClock(a, at);
  const wb = wallClock(b, at);
  return Math.round((Date.UTC(wb.year, wb.month, wb.day) - Date.UTC(wa.year, wa.month, wa.day)) / 86_400_000);
}

/* ----------------------------- Formatting ----------------------------- */

const fmtCache = new Map<string, Intl.DateTimeFormat>();
function fmt(key: string, opts: Intl.DateTimeFormatOptions) {
  let f = fmtCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", opts);
    fmtCache.set(key, f);
  }
  return f;
}

export function formatTime(at: number, tz: string, clock: "12" | "24", seconds = false) {
  return fmt(`t:${tz}:${clock}:${seconds}`, {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    ...(seconds ? { second: "2-digit" } : {}),
    hourCycle: clock === "12" ? "h12" : "h23",
  }).format(at);
}

export function formatHour(at: number, tz: string, clock: "12" | "24") {
  return fmt(`h:${tz}:${clock}`, {
    timeZone: tz,
    hour: clock === "12" ? "numeric" : "2-digit",
    ...(clock === "24" ? { minute: "2-digit" } : {}),
    hourCycle: clock === "12" ? "h12" : "h23",
  }).format(at);
}

export function formatDate(at: number, tz: string, style: "long" | "short" | "weekday" = "long") {
  const opts: Intl.DateTimeFormatOptions =
    style === "long"
      ? { weekday: "long", month: "long", day: "numeric", year: "numeric" }
      : style === "short"
        ? { weekday: "short", month: "short", day: "numeric" }
        : { weekday: "short" };
  return fmt(`d:${tz}:${style}`, { timeZone: tz, ...opts }).format(at);
}

/** Format an instant in a Zone (works for fixed offsets too). */
export function formatZoneTime(z: Zone, at: number, clock: "12" | "24") {
  return formatTime(wallClock(z, at).shifted.getTime(), "UTC", clock);
}
export function formatZoneDate(z: Zone, at: number, style: "long" | "short" = "short") {
  return formatDate(wallClock(z, at).shifted.getTime(), "UTC", style);
}
