import Image from "next/image";
import { FeatureTiles, HeroSearch, SavedCities } from "@/components/dashboard/Dashboard";

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="relative pt-6 sm:pt-10">
        <div className="pointer-events-none absolute -top-6 right-0 hidden select-none gap-2 lg:flex" aria-hidden>
          <Image src="/weather-icons/partly-cloudy-day.svg" alt="" width={120} height={120} unoptimized className="shrink-0 opacity-90" />
          <Image src="/weather-icons/thunderstorms-night-rain.svg" alt="" width={90} height={90} unoptimized className="mt-16 shrink-0 opacity-70" />
          <Image src="/weather-icons/snow.svg" alt="" width={80} height={80} unoptimized className="-mt-2 shrink-0 opacity-60" />
        </div>
        <p className="rise mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent">Weather · Time · Zones</p>
        <h1 className="rise max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl" style={{ animationDelay: "60ms" }}>
          The weather and the <span className="gradient-text">exact time</span>, anywhere on Earth.
        </h1>
        <p className="rise mt-4 max-w-2xl text-lg text-muted" style={{ animationDelay: "120ms" }}>
          Live conditions, local clocks and time zones for every city. Compare places side by side and convert times in a click.
        </p>
        <div className="rise mt-8 max-w-3xl" style={{ animationDelay: "180ms" }}>
          <HeroSearch />
        </div>
      </section>

      <SavedCities />
      <FeatureTiles />
    </div>
  );
}
