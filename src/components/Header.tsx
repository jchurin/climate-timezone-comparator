"use client";

import { Clock3, Columns3, LayoutGrid, Moon, Search, Settings2, Sun } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { updateSettings, useHydrated, useSettings } from "@/lib/store";
import { useSearch } from "./search/SearchProvider";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/compare", label: "Compare", icon: Columns3 },
  { href: "/time", label: "Time converter", icon: Clock3 },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

function NavLinks({ pathname, mobile = false }: { pathname: string | null; mobile?: boolean }) {
  const isActive = (href: string) => pathname != null && (href === "/" ? pathname === "/" : pathname.startsWith(href));
  return (
    <>
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) ? "page" : undefined}
          className={
            mobile
              ? `flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${isActive(href) ? "bg-accent-soft text-accent" : "text-muted"}`
              : `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  isActive(href) ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-2 hover:text-ink"
                }`
          }
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </>
  );
}

/** Reads the pathname (request-time data), so it lives behind its own Suspense boundary. */
function ActiveNav({ mobile }: { mobile?: boolean }) {
  return <NavLinks pathname={usePathname()} mobile={mobile} />;
}

function Nav({ mobile }: { mobile?: boolean }) {
  return (
    <Suspense fallback={<NavLinks pathname={null} mobile={mobile} />}>
      <ActiveNav mobile={mobile} />
    </Suspense>
  );
}

export function Header() {
  const { openSearch } = useSearch();
  const settings = useSettings();
  const hydrated = useHydrated();

  const toggleTheme = () => {
    const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    updateSettings({ theme: current === "dark" ? "light" : "dark" });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="group mr-2 flex items-center gap-2">
          <span className="relative grid size-9 place-items-center rounded-xl bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-500 shadow-lg shadow-blue-500/30 transition-transform group-hover:-rotate-6">
            <Image src="/weather-icons/clear-day.svg" alt="" width={34} height={34} unoptimized className="drop-shadow" />
          </span>
          <span className="text-xl font-semibold tracking-tight">
            tiem<span className="gradient-text">po</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          <Nav />
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={openSearch}
            className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-muted transition hover:text-ink"
            aria-label="Search cities"
          >
            <Search className="size-4" />
            <span className="hidden sm:inline">Search city…</span>
            <kbd className="hidden rounded-md border border-line px-1.5 text-[10px] lg:inline">⌘K</kbd>
          </button>

          <button
            onClick={() => updateSettings({ temp: settings.temp === "c" ? "f" : "c" })}
            className="relative flex h-9 w-[76px] items-center rounded-xl border border-line bg-surface p-1 text-xs font-semibold"
            aria-label={`Temperature unit: ${settings.temp === "c" ? "Celsius" : "Fahrenheit"}. Click to switch.`}
          >
            <span
              className={`absolute top-1 h-7 w-[33px] rounded-lg bg-surface-solid shadow-sm ring-1 ring-line transition-transform duration-300 ${
                hydrated && settings.temp === "f" ? "translate-x-[33px]" : ""
              }`}
            />
            <span className={`relative flex-1 text-center ${settings.temp === "c" ? "text-ink" : "text-faint"}`}>°C</span>
            <span className={`relative flex-1 text-center ${settings.temp === "f" ? "text-ink" : "text-faint"}`}>°F</span>
          </button>

          <button
            onClick={toggleTheme}
            className="grid size-9 place-items-center rounded-xl border border-line bg-surface text-muted transition hover:text-ink"
            aria-label="Toggle dark mode"
          >
            <Sun className="hidden size-4 dark:block" />
            <Moon className="size-4 dark:hidden" />
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="no-scrollbar flex gap-1 overflow-x-auto px-4 pb-2 sm:px-6 lg:hidden" aria-label="Main mobile">
        <Nav mobile />
      </nav>
    </header>
  );
}
