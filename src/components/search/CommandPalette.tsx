"use client";

import { ArrowRight, Clock3, Columns3, Loader2, MapPin, Moon, Search, Settings2, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { cityHref } from "@/lib/api";
import { useCitySearch } from "@/lib/hooks";
import { updateSettings, useSavedCities, useSettings } from "@/lib/store";
import { LiveClock } from "../LiveClock";
import { Flag } from "../ui";
import { cityLine } from "./CityCombobox";
import { useLocate } from "./LocateButton";

type Item = { key: string; icon: React.ReactNode; title: string; subtitle?: string; right?: React.ReactNode; run: () => void };

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const saved = useSavedCities();
  const settings = useSettings();
  const { data, pending } = useCitySearch(query);
  const locate = useLocate();
  const listRef = useRef<HTMLDivElement>(null);

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  const isDark = typeof document !== "undefined" && document.documentElement.dataset.theme === "dark";

  const sections = useMemo(() => {
    const q = query.trim();
    if (q.length >= 2) {
      return [
        {
          title: "Cities",
          items: (data ?? []).map<Item>((c) => ({
            key: `c${c.id}`,
            icon: <Flag code={c.countryCode} size={14} />,
            title: c.name,
            subtitle: cityLine(c),
            right: <LiveClock tz={c.timezone} className="text-xs text-muted" />,
            run: () => go(cityHref(c)),
          })),
        },
      ];
    }
    return [
      {
        title: "Your cities",
        items: saved.map<Item>((c) => ({
          key: `s${c.id}`,
          icon: <Flag code={c.countryCode} size={14} />,
          title: c.name,
          subtitle: cityLine(c),
          right: <LiveClock tz={c.timezone} className="text-xs text-muted" />,
          run: () => go(cityHref(c)),
        })),
      },
      {
        title: "Go to",
        items: [
          { key: "loc", icon: <MapPin className="size-4" />, title: "Weather at my location", run: () => { onClose(); locate.run(); } },
          { key: "cmp", icon: <Columns3 className="size-4" />, title: "Compare cities", run: () => go(`/compare?cities=${saved.slice(0, 3).map((c) => c.id).join(",")}`) },
          { key: "tz", icon: <Clock3 className="size-4" />, title: "Time zone converter", run: () => go("/time") },
          { key: "set", icon: <Settings2 className="size-4" />, title: "Settings", run: () => go("/settings") },
          {
            key: "theme",
            icon: isDark ? <Sun className="size-4" /> : <Moon className="size-4" />,
            title: isDark ? "Switch to light theme" : "Switch to dark theme",
            run: () => { updateSettings({ theme: isDark ? "light" : "dark" }); onClose(); },
          },
          {
            key: "unit",
            icon: <span className="text-xs font-bold">°{settings.temp === "c" ? "F" : "C"}</span>,
            title: `Use ${settings.temp === "c" ? "Fahrenheit" : "Celsius"}`,
            run: () => { updateSettings({ temp: settings.temp === "c" ? "f" : "c" }); onClose(); },
          },
        ] as Item[],
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, data, saved, settings.temp, isDark]);

  const flat = sections.flatMap((s) => s.items);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  let index = -1;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal aria-label="Search">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="rise relative w-full max-w-xl overflow-hidden rounded-3xl border border-line bg-surface-solid shadow-2xl">
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          {pending && query.trim().length >= 2 ? <Loader2 className="size-5 animate-spin text-faint" /> : <Search className="size-5 text-faint" />}
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(flat.length - 1, a + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(0, a - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                flat[active]?.run();
              }
            }}
            placeholder="Search a city or jump anywhere…"
            className="w-full bg-transparent text-lg outline-none placeholder:text-faint"
          />
          <kbd className="rounded-md border border-line px-1.5 py-0.5 text-[10px] text-faint">ESC</kbd>
        </div>
        <div ref={listRef} className="max-h-[55vh] overflow-auto p-2">
          {query.trim().length >= 2 && !pending && flat.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-muted">No cities match “{query.trim()}”.</p>
          )}
          {sections.map(
            (s) =>
              s.items.length > 0 && (
                <div key={s.title} className="mb-1">
                  <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-faint">{s.title}</p>
                  {s.items.map((item) => {
                    index++;
                    const i = index;
                    return (
                      <button
                        key={item.key}
                        data-index={i}
                        onClick={item.run}
                        onMouseMove={() => setActive(i)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ${i === active ? "bg-accent-soft" : ""}`}
                      >
                        <span className="grid size-7 place-items-center text-muted">{item.icon}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{item.title}</span>
                          {item.subtitle && <span className="block truncate text-xs text-muted">{item.subtitle}</span>}
                        </span>
                        {item.right}
                        {i === active && <ArrowRight className="size-4 text-accent" />}
                      </button>
                    );
                  })}
                </div>
              ),
          )}
        </div>
      </div>
    </div>
  );
}
