export type Scene = "clear" | "partly" | "cloudy" | "fog" | "drizzle" | "rain" | "snow" | "storm";

type Entry = { label: string; day: string; night: string; scene: Scene };

const e = (label: string, day: string, night: string, scene: Scene): Entry => ({ label, day, night, scene });

/** WMO weather interpretation codes (used by Open-Meteo) → label, Meteocons icon, scene. */
const CODES: Record<number, Entry> = {
  0: e("Clear sky", "clear-day", "clear-night", "clear"),
  1: e("Mainly clear", "partly-cloudy-day", "partly-cloudy-night", "partly"),
  2: e("Partly cloudy", "partly-cloudy-day", "partly-cloudy-night", "partly"),
  3: e("Overcast", "overcast-day", "overcast-night", "cloudy"),
  45: e("Fog", "fog-day", "fog-night", "fog"),
  48: e("Freezing fog", "fog-day", "fog-night", "fog"),
  51: e("Light drizzle", "partly-cloudy-day-drizzle", "partly-cloudy-night-drizzle", "drizzle"),
  53: e("Drizzle", "drizzle", "drizzle", "drizzle"),
  55: e("Heavy drizzle", "drizzle", "drizzle", "drizzle"),
  56: e("Freezing drizzle", "sleet", "sleet", "drizzle"),
  57: e("Freezing drizzle", "sleet", "sleet", "drizzle"),
  61: e("Light rain", "partly-cloudy-day-rain", "partly-cloudy-night-rain", "rain"),
  63: e("Rain", "rain", "rain", "rain"),
  65: e("Heavy rain", "rain", "rain", "rain"),
  66: e("Freezing rain", "sleet", "sleet", "rain"),
  67: e("Freezing rain", "sleet", "sleet", "rain"),
  71: e("Light snow", "partly-cloudy-day-snow", "partly-cloudy-night-snow", "snow"),
  73: e("Snow", "snow", "snow", "snow"),
  75: e("Heavy snow", "snow", "snow", "snow"),
  77: e("Snow grains", "snowflake", "snowflake", "snow"),
  80: e("Rain showers", "partly-cloudy-day-rain", "partly-cloudy-night-rain", "rain"),
  81: e("Rain showers", "rain", "rain", "rain"),
  82: e("Violent showers", "rain", "rain", "storm"),
  85: e("Snow showers", "partly-cloudy-day-snow", "partly-cloudy-night-snow", "snow"),
  86: e("Heavy snow showers", "snow", "snow", "snow"),
  95: e("Thunderstorm", "thunderstorms-day-rain", "thunderstorms-night-rain", "storm"),
  96: e("Thunderstorm with hail", "thunderstorms-day-rain", "thunderstorms-night-rain", "storm"),
  99: e("Severe thunderstorm", "hail", "hail", "storm"),
};

const UNKNOWN = e("Unknown", "not-available", "not-available", "cloudy");

export function weatherInfo(code: number, isDay = true) {
  const entry = CODES[code] ?? UNKNOWN;
  return { label: entry.label, icon: isDay ? entry.day : entry.night, scene: entry.scene };
}

export function uvLevel(uv: number) {
  if (uv < 3) return "Low";
  if (uv < 6) return "Moderate";
  if (uv < 8) return "High";
  if (uv < 11) return "Very high";
  return "Extreme";
}

export function compassPoint(deg: number) {
  const points = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return points[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16];
}
