"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { fetchForecasts, getCityById, searchCities } from "./api";
import type { City, Forecast } from "./types";

const TEN_MIN = 10 * 60 * 1000;

/**
 * Forecasts for several cities in one request, keyed by city id (so results can
 * never be matched to the wrong city while the list changes). Cached and
 * refreshed every 10 minutes.
 */
export function useForecasts(cities: City[] | null | undefined) {
  const key = cities?.length ? ["forecast", ...cities.map((c) => c.id)].join(":") : null;
  return useSWR(
    key,
    async () => {
      const list = await fetchForecasts(cities!);
      return Object.fromEntries(cities!.map((c, i) => [c.id, list[i]])) as Record<number, Forecast>;
    },
    {
    refreshInterval: TEN_MIN,
    revalidateOnFocus: false,
    keepPreviousData: true,
    },
  );
}

export function useCities(ids: number[]) {
  const key = ids.length ? `cities:${ids.join(",")}` : null;
  return useSWR(key, () => Promise.all(ids.map((id) => getCityById(id))), {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });
}

export function useDebounced<T>(value: T, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function useCitySearch(query: string) {
  const q = useDebounced(query.trim());
  const res = useSWR(q.length >= 2 ? `search:${q.toLowerCase()}` : null, () => searchCities(q), {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });
  return { ...res, data: q.length >= 2 ? res.data : undefined, pending: query.trim() !== q || res.isLoading };
}
