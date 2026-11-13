"use client";

import { Loader2, LocateFixed } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cityFromCoords, cityHref } from "@/lib/api";

/** Browser geolocation → nearest city → navigate to its page. */
export function useLocate() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const [message, setMessage] = useState("");

  const run = () => {
    if (!("geolocation" in navigator)) {
      setState("error");
      setMessage("Geolocation isn't available in this browser.");
      return;
    }
    setState("busy");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const city = await cityFromCoords(coords.latitude, coords.longitude).catch(() => null);
        if (city) {
          setState("idle");
          router.push(cityHref(city));
        } else {
          setState("error");
          setMessage("Couldn't find a city near you. Try searching instead.");
        }
      },
      (err) => {
        setState("error");
        setMessage(err.code === err.PERMISSION_DENIED ? "Location permission was denied." : "Couldn't get your location.");
      },
      { timeout: 10_000, maximumAge: 600_000 },
    );
  };

  return { run, state, message };
}

export function LocateButton() {
  const { run, state, message } = useLocate();
  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        type="button"
        onClick={run}
        disabled={state === "busy"}
        className="inline-flex items-center gap-2 rounded-2xl border border-line bg-surface-solid/70 px-4 py-3 text-sm font-medium shadow-sm transition hover:border-accent/40 hover:text-accent disabled:opacity-60"
      >
        {state === "busy" ? <Loader2 className="size-4 animate-spin" /> : <LocateFixed className="size-4" />}
        Use my location
      </button>
      {state === "error" && <p className="text-xs text-rose-500">{message}</p>}
    </div>
  );
}
