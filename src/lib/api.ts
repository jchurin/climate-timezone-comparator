import type { City, Forecast } from "./types";

const GEO = "https://geocoding-api.open-meteo.com/v1";
const FORECAST = "https://api.open-meteo.com/v1/forecast";

type GeoResult = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
  admin1?: string;
  timezone?: string;
  population?: number;
};

function toCity(r: GeoResult): City | null {
  if (!r.timezone) return null;
  return {
    id: r.id,
    name: r.name,
    country: r.country ?? "",
    countryCode: (r.country_code ?? "").toLowerCase(),
    admin1: r.admin1,
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: r.timezone,
    population: r.population,
  };
}

export async function searchCities(query: string, count = 8): Promise<City[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const res = await fetch(`${GEO}/search?name=${encodeURIComponent(q)}&count=${count}&language=en&format=json`);
  if (!res.ok) throw new Error(`City search failed (${res.status})`);
  const data = (await res.json()) as { results?: GeoResult[] };
  return (data.results ?? []).map(toCity).filter((c): c is City => !!c);
}

/** Returns null if the id doesn't exist. */
export async function getCityById(id: number): Promise<City | null> {
  const res = await fetch(`${GEO}/get?id=${id}`);
  if (res.status === 400 || res.status === 404) return null;
  if (!res.ok) throw new Error(`City lookup failed (${res.status})`);
  const data = (await res.json()) as GeoResult & { error?: boolean };
  if (data.error || !data.id) return null;
  return toCity(data);
}

const CURRENT = [
  "temperature_2m", "relative_humidity_2m", "apparent_temperature", "is_day", "precipitation",
  "weather_code", "cloud_cover", "pressure_msl", "wind_speed_10m", "wind_direction_10m",
  "wind_gusts_10m", "uv_index", "visibility",
].join(",");
const HOURLY = ["temperature_2m", "weather_code", "precipitation_probability", "is_day"].join(",");
const DAILY = [
  "weather_code", "temperature_2m_max", "temperature_2m_min", "sunrise", "sunset",
  "precipitation_probability_max", "precipitation_sum", "uv_index_max", "wind_speed_10m_max",
  "daylight_duration",
].join(",");

/** One request for any number of locations (Open-Meteo supports comma-separated coordinates). */
export async function fetchForecasts(cities: Pick<City, "latitude" | "longitude">[]): Promise<Forecast[]> {
  if (!cities.length) return [];
  const lat = cities.map((c) => c.latitude.toFixed(4)).join(",");
  const lon = cities.map((c) => c.longitude.toFixed(4)).join(",");
  const res = await fetch(
    `${FORECAST}?latitude=${lat}&longitude=${lon}&current=${CURRENT}&hourly=${HOURLY}&daily=${DAILY}` +
      `&timezone=auto&timeformat=unixtime&forecast_days=7`,
  );
  if (!res.ok) throw new Error(`Forecast failed (${res.status})`);
  const data = (await res.json()) as Forecast | Forecast[];
  return Array.isArray(data) ? data : [data];
}

/** Coordinates → nearest known city (reverse-geocode the name, then match it in Open-Meteo). */
export async function cityFromCoords(lat: number, lon: number): Promise<City | null> {
  const res = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
  );
  if (!res.ok) return null;
  const place = (await res.json()) as { city?: string; locality?: string; principalSubdivision?: string };
  const names = [place.city, place.locality, place.principalSubdivision].filter(Boolean) as string[];
  for (const name of names) {
    const results = await searchCities(name, 10).catch(() => []);
    if (!results.length) continue;
    const dist = (c: City) => (c.latitude - lat) ** 2 + (c.longitude - lon) ** 2;
    const best = results.reduce((a, b) => (dist(b) < dist(a) ? b : a));
    if (dist(best) < 1.5) return best; // within roughly 100 km
  }
  return null;
}

export function citySlug(city: Pick<City, "id" | "name">) {
  const name = city.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${city.id}${name ? `-${name}` : ""}`;
}

export function cityHref(city: Pick<City, "id" | "name">) {
  return `/city/${citySlug(city)}`;
}

export function flagUrl(countryCode: string) {
  return countryCode ? `https://flagcdn.com/${countryCode}.svg` : null;
}

export const DEFAULT_CITIES: City[] = [
  { id: 5128581, name: "New York", country: "United States", countryCode: "us", admin1: "New York", latitude: 40.71427, longitude: -74.00597, timezone: "America/New_York" },
  { id: 2643743, name: "London", country: "United Kingdom", countryCode: "gb", admin1: "England", latitude: 51.50853, longitude: -0.12574, timezone: "Europe/London" },
  { id: 1850147, name: "Tokyo", country: "Japan", countryCode: "jp", admin1: "Tokyo", latitude: 35.6895, longitude: 139.69171, timezone: "Asia/Tokyo" },
  { id: 2147714, name: "Sydney", country: "Australia", countryCode: "au", admin1: "New South Wales", latitude: -33.86785, longitude: 151.20732, timezone: "Australia/Sydney" },
];
