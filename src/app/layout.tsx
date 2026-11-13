import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { Header } from "@/components/Header";
import { ThemeController } from "@/components/ThemeController";
import { SearchProvider } from "@/components/search/SearchProvider";
import "./globals.css";

const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Tiempo — Weather & time, everywhere", template: "%s · Tiempo" },
  description: "Live weather, local time and timezone conversion for any city in the world.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#edf2fb" },
    { media: "(prefers-color-scheme: dark)", color: "#060a14" },
  ],
};

// Applies the saved theme before first paint, so there is no light/dark flash.
// Keep the storage key in sync with SETTINGS_KEY in src/lib/store.ts.
const themeScript = `(function(){try{var s=JSON.parse(localStorage.getItem("tiempo:settings")||"{}");var t=s.theme;if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <div className="app-backdrop" aria-hidden />
        <ThemeController />
        <SearchProvider>
          <Header />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-6 sm:px-6">{children}</main>
          <footer className="border-t border-line py-6 text-center text-xs text-faint">
            Weather data by{" "}
            <a className="underline-offset-2 hover:underline" href="https://open-meteo.com/" target="_blank" rel="noreferrer">
              Open-Meteo
            </a>{" "}
            · Icons by{" "}
            <a className="underline-offset-2 hover:underline" href="https://github.com/basmilius/weather-icons" target="_blank" rel="noreferrer">
              Meteocons
            </a>{" "}
            (MIT)
          </footer>
        </SearchProvider>
      </body>
    </html>
  );
}
