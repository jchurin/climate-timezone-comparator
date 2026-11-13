"use client";

import Image from "next/image";
import { flagUrl } from "@/lib/api";
import { weatherInfo } from "@/lib/weather-codes";

/** Animated Meteocons icon (rendered as <img> so each SVG's animation and ids stay isolated). */
export function WeatherIcon({
  code,
  isDay = true,
  size = 48,
  className = "",
}: {
  code: number;
  isDay?: boolean;
  size?: number;
  className?: string;
}) {
  const { icon, label } = weatherInfo(code, isDay);
  return (
    <Image
      src={`/weather-icons/${icon}.svg`}
      alt={label}
      title={label}
      width={size}
      height={size}
      unoptimized
      loading={size >= 120 ? "eager" : "lazy"}
      className={`shrink-0 select-none ${className}`}
      draggable={false}
    />
  );
}

export function MetaIcon({ name, size = 40, className = "", alt = "" }: { name: string; size?: number; className?: string; alt?: string }) {
  return (
    <Image src={`/weather-icons/${name}.svg`} alt={alt} width={size} height={size} unoptimized className={`shrink-0 ${className}`} draggable={false} />
  );
}

export function Flag({ code, size = 20, className = "" }: { code: string; size?: number; className?: string }) {
  const src = flagUrl(code);
  if (!src) return null;
  return (
    <Image
      src={src}
      alt={code.toUpperCase()}
      width={Math.round(size * 1.4)}
      height={size}
      unoptimized
      className={`shrink-0 rounded-[3px] object-cover shadow-sm ring-1 ring-black/10 ${className}`}
      style={{ width: Math.round(size * 1.4), height: size }}
    />
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  size = "md",
}: {
  value: T;
  options: { value: T; label: React.ReactNode; title?: string }[];
  onChange: (v: T) => void;
  label: string;
  size?: "sm" | "md";
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-xl border border-line bg-surface-2 p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={`rounded-lg font-medium transition-all ${size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm"} ${
              active
                ? "bg-surface-solid text-ink shadow-sm ring-1 ring-line"
                : "text-muted hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function SectionTitle({ icon, children, action }: { icon?: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 whitespace-nowrap text-sm font-semibold uppercase tracking-wider text-muted">
        {icon}
        {children}
      </h2>
      {action}
    </div>
  );
}
