"use client";

import { ArrowRight, Clock3, Columns3, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cityHref } from "@/lib/api";
import { useForecasts } from "@/lib/hooks";
import { removeSavedCity, useHydrated, useSavedCities } from "@/lib/store";
import { CityCombobox } from "../search/CityCombobox";
import { LocateButton } from "../search/LocateButton";
import { useSearch } from "../search/SearchProvider";
import { SectionTitle } from "../ui";
import { CityCard } from "./CityCard";

export function HeroSearch() {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="flex-1">
        <CityCombobox size="lg" placeholder="Search any city in the world…" onSelect={(c) => router.push(cityHref(c))} />
      </div>
      <LocateButton />
    </div>
  );
}

export function SavedCities() {
  const hydrated = useHydrated();
  const cities = useSavedCities();
  const { data, error } = useForecasts(hydrated ? cities : null);
  const { openSearch } = useSearch();

  if (!hydrated) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="skeleton h-[232px] !rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <section>
      <SectionTitle
        action={
          cities.length >= 2 && (
            <Link
              href={`/compare?cities=${cities.slice(0, 4).map((c) => c.id).join(",")}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
            >
              Compare {Math.min(4, cities.length)} cities <ArrowRight className="size-4" />
            </Link>
          )
        }
      >
        Your cities
      </SectionTitle>

      {error && (
        <p className="card mb-4 px-5 py-3 text-sm text-muted">Couldn&apos;t load the weather right now. Retrying automatically…</p>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cities.map((c, i) => (
          <CityCard key={c.id} city={c} forecast={data?.[c.id]} index={i} onRemove={() => removeSavedCity(c.id)} />
        ))}
        <button
          onClick={openSearch}
          className="rise flex h-[232px] flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-line text-muted transition hover:border-accent/50 hover:bg-accent-soft hover:text-accent"
        >
          <span className="grid size-12 place-items-center rounded-2xl bg-surface-2">
            <Plus className="size-6" />
          </span>
          <span className="font-medium">Add a city</span>
          <span className="text-xs text-faint">Search and press ☆ Save on its page</span>
        </button>
      </div>
    </section>
  );
}

export function FeatureTiles() {
  return (
    <section className="grid gap-5 md:grid-cols-2">
      <Link href="/time" className="card group flex items-center gap-5 p-6 transition hover:-translate-y-0.5">
        <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30">
          <Clock3 className="size-8" />
        </span>
        <div className="flex-1">
          <h3 className="text-lg font-semibold">Time zone converter</h3>
          <p className="text-sm text-muted">Convert between cities, IANA zones or abbreviations like EST → GMT, and find the best meeting hour.</p>
        </div>
        <ArrowRight className="size-5 text-faint transition group-hover:translate-x-1 group-hover:text-accent" />
      </Link>
      <Link href="/compare" className="card group flex items-center gap-5 p-6 transition hover:-translate-y-0.5">
        <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-500 text-white shadow-lg shadow-sky-500/30">
          <Columns3 className="size-8" />
        </span>
        <div className="flex-1">
          <h3 className="text-lg font-semibold">Compare cities</h3>
          <p className="text-sm text-muted">Put up to four cities side by side: temperature, rain, wind, UV, daylight and local time.</p>
        </div>
        <ArrowRight className="size-5 text-faint transition group-hover:translate-x-1 group-hover:text-accent" />
      </Link>
    </section>
  );
}

