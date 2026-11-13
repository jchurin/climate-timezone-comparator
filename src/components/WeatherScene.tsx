import type { Scene } from "@/lib/weather-codes";

/** Deterministic pseudo-random in [0,1) so server and client render the same particles. */
function rand(i: number, seed: number) {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const GRADIENTS: Record<Scene, [string, string]> = {
  clear: ["linear-gradient(160deg, #1d8fe1 0%, #3fb5f5 45%, #9fd9ff 100%)", "linear-gradient(160deg, #0b1236 0%, #1e1b4b 55%, #312e81 100%)"],
  partly: ["linear-gradient(160deg, #3a86d4 0%, #6aaee8 55%, #b8d8f2 100%)", "linear-gradient(160deg, #0f172a 0%, #1e2a4f 55%, #33407a 100%)"],
  cloudy: ["linear-gradient(160deg, #5b6b82 0%, #7d8ca3 55%, #a6b2c4 100%)", "linear-gradient(160deg, #111827 0%, #1f2937 55%, #374151 100%)"],
  fog: ["linear-gradient(160deg, #7c8797 0%, #9aa4b2 55%, #c3c9d2 100%)", "linear-gradient(160deg, #1a202c 0%, #2d3748 55%, #4a5568 100%)"],
  drizzle: ["linear-gradient(160deg, #47607d 0%, #6c84a0 55%, #93a7bd 100%)", "linear-gradient(160deg, #0d1626 0%, #1b2a40 55%, #2c3e57 100%)"],
  rain: ["linear-gradient(160deg, #2f4560 0%, #4b6584 55%, #6f87a3 100%)", "linear-gradient(160deg, #070d1a 0%, #142035 55%, #22324d 100%)"],
  snow: ["linear-gradient(160deg, #5f88b8 0%, #8eb0d6 55%, #c9dcef 100%)", "linear-gradient(160deg, #13223b 0%, #24395a 55%, #3d5478 100%)"],
  storm: ["linear-gradient(160deg, #241f4d 0%, #3b2f6e 55%, #5b4a8f 100%)", "linear-gradient(160deg, #0a0820 0%, #1a1540 55%, #2c2160 100%)"],
};

export function WeatherScene({ scene, isDay, density = 1 }: { scene: Scene; isDay: boolean; density?: number }) {
  const [day, night] = GRADIENTS[scene];
  const n = (count: number) => Math.round(count * density);

  return (
    <div className="scene" aria-hidden style={{ background: isDay ? day : night }}>
      {/* Sun / moon glow */}
      {(scene === "clear" || scene === "partly") &&
        (isDay ? (
          <div
            className="sun-glow"
            style={{ width: 320, height: 320, right: -80, top: -110, background: "radial-gradient(circle, rgba(255,226,130,0.95) 0%, rgba(255,196,60,0.45) 35%, transparent 70%)" }}
          />
        ) : (
          <div
            className="sun-glow"
            style={{ width: 220, height: 220, right: -40, top: -70, background: "radial-gradient(circle, rgba(226,232,255,0.55) 0%, rgba(165,180,252,0.18) 40%, transparent 70%)" }}
          />
        ))}

      {/* Stars on clear-ish nights */}
      {!isDay &&
        (scene === "clear" || scene === "partly") &&
        Array.from({ length: n(40) }, (_, i) => {
          const s = 1 + rand(i, 1) * 1.8;
          return (
            <span
              key={`s${i}`}
              className="star"
              style={{ left: `${rand(i, 2) * 100}%`, top: `${rand(i, 3) * 75}%`, width: s, height: s, animationDuration: `${2 + rand(i, 4) * 4}s`, animationDelay: `${-rand(i, 5) * 5}s` }}
            />
          );
        })}

      {/* Drifting clouds */}
      {scene !== "clear" &&
        Array.from({ length: scene === "partly" ? 3 : 5 }, (_, i) => (
          <span
            key={`c${i}`}
            className="cloud"
            style={{
              width: `${40 + rand(i, 6) * 40}%`,
              height: `${30 + rand(i, 7) * 30}%`,
              left: `${rand(i, 8) * 70}%`,
              top: `${-10 + rand(i, 9) * 50}%`,
              opacity: isDay ? 0.55 : 0.18,
              animationDuration: `${18 + rand(i, 10) * 18}s`,
              animationDelay: `${-rand(i, 11) * 20}s`,
            }}
          />
        ))}

      {/* Fog bands */}
      {scene === "fog" &&
        Array.from({ length: 4 }, (_, i) => (
          <span
            key={`f${i}`}
            className="cloud"
            style={{ width: "120%", height: "18%", left: "-10%", top: `${20 + i * 18}%`, opacity: 0.45, animationDuration: `${14 + i * 5}s` }}
          />
        ))}

      {/* Rain */}
      {(scene === "rain" || scene === "drizzle" || scene === "storm") &&
        Array.from({ length: n(scene === "drizzle" ? 30 : 60) }, (_, i) => (
          <span
            key={`r${i}`}
            className="drop"
            style={{
              left: `${rand(i, 12) * 105}%`,
              height: scene === "drizzle" ? 12 : 22,
              opacity: 0.35 + rand(i, 13) * 0.5,
              animationDuration: `${0.55 + rand(i, 14) * 0.5}s`,
              animationDelay: `${-rand(i, 15) * 2}s`,
            }}
          />
        ))}

      {/* Snow */}
      {scene === "snow" &&
        Array.from({ length: n(50) }, (_, i) => {
          const s = 2 + rand(i, 16) * 4;
          return (
            <span
              key={`w${i}`}
              className="flake"
              style={{ left: `${rand(i, 17) * 100}%`, width: s, height: s, opacity: 0.5 + rand(i, 18) * 0.5, animationDuration: `${6 + rand(i, 19) * 8}s`, animationDelay: `${-rand(i, 20) * 12}s` }}
            />
          );
        })}

      {scene === "storm" && <div className="lightning" />}

      {/* Readability veil at the bottom */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/30 to-transparent" />
    </div>
  );
}
