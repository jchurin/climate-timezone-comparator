import type { Metadata } from "next";
import { Suspense } from "react";
import { TimeConverter } from "@/components/time/TimeConverter";

export const metadata: Metadata = { title: "Time zone converter" };

export default function TimePage() {
  return (
    <Suspense fallback={<div className="skeleton h-[560px] !rounded-3xl" />}>
      <TimeConverter />
    </Suspense>
  );
}
