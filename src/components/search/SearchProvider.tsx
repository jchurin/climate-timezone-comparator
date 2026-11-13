"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CommandPalette } from "./CommandPalette";

const SearchContext = createContext<{ openSearch: () => void }>({ openSearch: () => {} });

export function useSearch() {
  return useContext(SearchContext);
}

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const openSearch = useCallback(() => setOpen(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <SearchContext.Provider value={{ openSearch }}>
      {children}
      {open && <CommandPalette onClose={() => setOpen(false)} />}
    </SearchContext.Provider>
  );
}
