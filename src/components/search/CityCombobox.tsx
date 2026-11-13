"use client";

import { Loader2, MapPin, Search } from "lucide-react";
import { useId, useState } from "react";
import { useCitySearch } from "@/lib/hooks";
import type { City } from "@/lib/types";
import { Flag } from "../ui";

export function cityLine(c: City) {
  return [c.admin1, c.country].filter(Boolean).join(", ");
}

/** Accessible city autocomplete. Calls onSelect with the chosen city. */
export function CityCombobox({
  onSelect,
  placeholder = "Search any city…",
  autoFocus,
  size = "md",
  excludeIds = [],
  clearOnSelect = true,
}: {
  onSelect: (city: City) => void;
  placeholder?: string;
  autoFocus?: boolean;
  size?: "md" | "lg";
  excludeIds?: number[];
  clearOnSelect?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const { data, pending, error } = useCitySearch(query);
  const results = (data ?? []).filter((c) => !excludeIds.includes(c.id));
  const listId = useId();
  const showList = open && query.trim().length >= 2;

  const choose = (c: City) => {
    onSelect(c);
    if (clearOnSelect) setQuery("");
    setOpen(false);
  };

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-3 rounded-2xl border border-line bg-surface-solid/80 shadow-sm transition focus-within:border-accent/50 focus-within:ring-4 focus-within:ring-accent/15 ${
          size === "lg" ? "px-5 py-4" : "px-4 py-2.5"
        }`}
      >
        {pending && query.trim().length >= 2 ? (
          <Loader2 className="size-5 shrink-0 animate-spin text-faint" />
        ) : (
          <Search className="size-5 shrink-0 text-faint" />
        )}
        <input
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          autoFocus={autoFocus}
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (!results.length) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => (a + 1) % results.length);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => (a - 1 + results.length) % results.length);
            } else if (e.key === "Enter") {
              e.preventDefault();
              choose(results[active] ?? results[0]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className={`w-full bg-transparent outline-none placeholder:text-faint ${size === "lg" ? "text-lg" : "text-sm"}`}
        />
      </div>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-40 mt-2 max-h-80 overflow-auto rounded-2xl border border-line bg-surface-solid p-1.5 shadow-2xl"
        >
          {error && <li className="px-3 py-3 text-sm text-muted">Search failed. Try again.</li>}
          {!error && !pending && results.length === 0 && (
            <li className="px-3 py-3 text-sm text-muted">No cities found for “{query.trim()}”.</li>
          )}
          {results.map((c, i) => (
            <li
              key={c.id}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(c);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 ${i === active ? "bg-accent-soft" : ""}`}
            >
              {c.countryCode ? <Flag code={c.countryCode} size={16} /> : <MapPin className="size-4 text-faint" />}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{c.name}</p>
                <p className="truncate text-xs text-muted">{cityLine(c)}</p>
              </div>
              <span className="hidden text-xs text-faint sm:block">{c.timezone}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
