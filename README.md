# Tiempo: weather & time, everywhere

Next.js 16 app (App Router, Cache Components, Tailwind v4) for live weather, exact local time and time-zone conversion in any city.

```bash
npm install
npm run dev    # http://localhost:3000
```

No API keys needed.

## Routes

| Route | What it does |
|---|---|
| `/` | Dashboard: city search, "use my location", saved cities as live cards (weather + local clock) |
| `/city/[id]-[name]` | Current weather, hourly & 7-day forecast, conditions, sun arc, exact local time/date/time zone (offset, abbreviation, DST) |
| `/compare?cities=id,id,…` | Up to 4 cities side by side: 7-day chart (high/low/rain/wind/UV) + detailed comparison table |
| `/time?from=…&to=…&t=…` | Time-zone converter (cities, IANA zones, abbreviations like EST/GMT/IST) + meeting planner. The URL is shareable |
| `/settings` | Theme (light/dark/system), °C/°F, wind, precipitation, pressure, distance units, 12/24h clock, saved cities |

Global: ⌘K / Ctrl+K (or `/`) opens a command palette for searching cities and quick actions. The header has quick °C/°F and theme toggles.

### Time-converter URL tokens
- `EST`, `GMT`, `IST`… fixed-offset abbreviations
- `Europe/London` any IANA zone (follows daylight saving)
- `Europe/London@London` IANA zone with a display label (used for cities)
- `local` the viewer's own time zone

## Data & assets
- Weather, geocoding: [Open-Meteo](https://open-meteo.com/) (free, no key). Called from the browser, so each visitor uses their own rate limit
- "Use my location" reverse geocoding: BigDataCloud free client API
- Weather icons: [Meteocons](https://github.com/basmilius/weather-icons) by Bas Milius (MIT), copied to `public/weather-icons`
- Flags: flagcdn.com · Font: Outfit (Google Fonts via `next/font`)

## Notes
- Settings and saved cities live in `localStorage`, read through `useSyncExternalStore` with server defaults, so there are no hydration mismatches. Clocks render a placeholder until hydrated.
- An inline script applies the saved theme before first paint (no light/dark flash).
