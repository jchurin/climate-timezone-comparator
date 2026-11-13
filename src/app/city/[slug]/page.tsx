import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CityView } from "@/components/city/CityView";
import { getCity } from "@/lib/server";

async function load(params: Promise<{ slug: string }>) {
  const { slug } = await params;
  const id = Number.parseInt(slug, 10);
  if (!Number.isFinite(id) || id <= 0) return null;
  return getCity(id);
}

export async function generateMetadata({ params }: PageProps<"/city/[slug]">): Promise<Metadata> {
  const city = await load(params);
  return city
    ? { title: `${city.name} weather & local time`, description: `Live weather, forecast and the exact local time in ${city.name}, ${city.country}.` }
    : { title: "City not found" };
}

export default function CityPage({ params }: PageProps<"/city/[slug]">) {
  return (
    <Suspense fallback={<CitySkeleton />}>
      <CityContent params={params} />
    </Suspense>
  );
}

async function CityContent({ params }: { params: Promise<{ slug: string }> }) {
  const city = await load(params);
  if (!city) notFound();
  return <CityView city={city} />;
}

function CitySkeleton() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-5 w-40" />
      <div className="skeleton h-[380px] !rounded-[2rem]" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="skeleton h-64 !rounded-3xl lg:col-span-2" />
        <div className="skeleton h-64 !rounded-3xl" />
      </div>
    </div>
  );
}
