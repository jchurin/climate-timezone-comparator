import type { Metadata } from "next";
import { Suspense } from "react";
import { CompareView } from "@/components/compare/CompareView";

export const metadata: Metadata = { title: "Compare cities" };

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="skeleton h-[480px] !rounded-3xl" />}>
      <CompareView />
    </Suspense>
  );
}
