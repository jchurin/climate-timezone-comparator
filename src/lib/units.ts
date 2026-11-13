import type { Settings } from "./store";

export function temp(c: number, s: Settings) {
  return s.temp === "f" ? (c * 9) / 5 + 32 : c;
}

export function fmtTemp(c: number | null | undefined, s: Settings, unit = false) {
  if (c == null || !Number.isFinite(c)) return "—";
  return `${Math.round(temp(c, s))}°${unit ? s.temp.toUpperCase() : ""}`;
}

export const WIND_LABEL = { kmh: "km/h", mph: "mph", ms: "m/s", kn: "kn" } as const;
export function fmtWind(kmh: number, s: Settings) {
  const v = { kmh, mph: kmh * 0.621371, ms: kmh / 3.6, kn: kmh * 0.539957 }[s.wind];
  return `${s.wind === "ms" ? v.toFixed(1) : Math.round(v)} ${WIND_LABEL[s.wind]}`;
}

export function fmtPrecip(mm: number, s: Settings) {
  return s.precip === "in" ? `${(mm / 25.4).toFixed(2)} in` : `${mm.toFixed(1)} mm`;
}

export function fmtPressure(hpa: number, s: Settings) {
  if (s.pressure === "inhg") return `${(hpa * 0.02953).toFixed(2)} inHg`;
  if (s.pressure === "mmhg") return `${Math.round(hpa * 0.750062)} mmHg`;
  return `${Math.round(hpa)} hPa`;
}

export function fmtDistance(m: number, s: Settings) {
  const v = s.distance === "mi" ? m / 1609.34 : m / 1000;
  return `${v >= 10 ? Math.round(v) : v.toFixed(1)} ${s.distance}`;
}

export function fmtDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}
