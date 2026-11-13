"use client";

import { Building2, Globe2, Loader2, Search, Tag, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCitySearch } from "@/lib/hooks";
import { ABBREVIATIONS, cityZoneToken, fmtOffset, tzCityName, tzOffset } from "@/lib/time";
import { Flag } from "../ui";

let ALL_TZ: string[] | null = null;
function allTimeZones() {
  if (!ALL_TZ) {
    const list = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.("timeZone") ?? [];
    ALL_TZ = ["UTC", ...list.filter((z) => z !== "UTC")];
  }
  return ALL_TZ;
}

type Option = { token: string; title: string; subtitle: string; offset: number; icon: React.ReactNode };

/** Modal picker: abbreviations (EST, GMT…), cities (via geocoding) and every IANA zone. */
export function ZonePicker({ onSelect, onClose, title = "Add a time zone" }: { onSelect: (token: string) => void; onClose: () => void; title?: string }) {
  const [query, setQuery] = useState("");
  const [now] = useState(() => Date.now());
  const { data: cities, pending } = useCitySearch(query);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const abbr: Option[] = ABBREVIATIONS.filter((a) => !q || a.code.toLowerCase().startsWith(q) || a.name.toLowerCase().includes(q))
      .slice(0, q ? 8 : 12)
      .map((a) => ({ token: a.code, title: a.code, subtitle: a.name, offset: a.offset, icon: <Tag className="size-4" /> }));
    const zones: Option[] = q
      ? allTimeZones()
          .filter((z) => z.toLowerCase().replace(/_/g, " ").includes(q))
          .slice(0, 8)
          .map((z) => ({ token: z, title: tzCityName(z), subtitle: z, offset: tzOffset(z, now), icon: <Globe2 className="size-4" /> }))
      : [];
    const cityOpts: Option[] = (cities ?? []).slice(0, 6).map((c) => ({
      token: cityZoneToken(c.timezone, c.name),
      title: c.name,
      subtitle: `${[c.admin1, c.country].filter(Boolean).join(", ")} · ${c.timezone}`,
      offset: tzOffset(c.timezone, now),
      icon: <Flag code={c.countryCode} size={12} />,
    }));
    return [
      { title: "Cities", icon: <Building2 className="size-3.5" />, items: cityOpts },
      { title: "Abbreviations", icon: <Tag className="size-3.5" />, items: abbr },
      { title: "Time zones", icon: <Globe2 className="size-3.5" />, items: zones },
    ].filter((g) => g.items.length);
  }, [query, cities, now]);

  const first = groups[0]?.items[0];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[10vh]" role="dialog" aria-modal aria-label={title}>
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="rise relative w-full max-w-lg overflow-hidden rounded-3xl border border-line bg-surface-solid shadow-2xl">
        <div className="flex items-center justify-between px-5 pt-4">
          <p className="font-semibold">{title}</p>
          <button onClick={onClose} aria-label="Close" className="grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2">
            <X className="size-4" />
          </button>
        </div>
        <div className="m-4 flex items-center gap-3 rounded-2xl border border-line px-4 py-3 focus-within:border-accent/50">
          {pending && query.trim().length >= 2 ? <Loader2 className="size-4 animate-spin text-faint" /> : <Search className="size-4 text-faint" />}
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && first && onSelect(first.token)}
            placeholder="City, zone or abbreviation (e.g. Paris, EST, Asia/Tokyo)"
            className="w-full bg-transparent outline-none placeholder:text-faint"
          />
        </div>
        <div className="max-h-[50vh] overflow-auto px-2 pb-3">
          {groups.map((g) => (
            <div key={g.title} className="mb-2">
              <p className="flex items-center gap-1.5 px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-faint">
                {g.icon} {g.title}
              </p>
              {g.items.map((o) => (
                <button
                  key={o.token}
                  onClick={() => onSelect(o.token)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-accent-soft"
                >
                  <span className="grid size-6 place-items-center text-muted">{o.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{o.title}</span>
                    <span className="block truncate text-xs text-muted">{o.subtitle}</span>
                  </span>
                  <span className="shrink-0 rounded-md bg-surface-2 px-2 py-0.5 text-xs font-medium tabular text-muted">{fmtOffset(o.offset)}</span>
                </button>
              ))}
            </div>
          ))}
          {query.trim().length >= 2 && !pending && groups.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-muted">Nothing matches “{query.trim()}”.</p>
          )}
        </div>
      </div>
    </div>
  );
}
