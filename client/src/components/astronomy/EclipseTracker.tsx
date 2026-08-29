import { useState } from "react";
import { Check } from "lucide-react";
import type { CelestialObject, Observation } from "@shared/schema";

interface EclipseTrackerProps {
  celestialObjects: CelestialObject[];
  observations: (Observation & { celestialObject?: any })[];
}

const ECLIPSES = [
  { key: "lunar", label: "Lunar Eclipse", icon: "fa-moon", accent: "from-orange-900 to-red-800" },
  { key: "solar", label: "Solar Eclipse", icon: "fa-sun", accent: "from-slate-800 to-amber-700" },
] as const;

type EclipseKey = (typeof ECLIPSES)[number]["key"];

/** Classify a catalog object name as a lunar or solar eclipse, or neither. */
function eclipseKindOf(name: string | undefined | null): EclipseKey | null {
  if (!name) return null;
  const n = name.toLowerCase();
  if (!n.includes("eclipse")) return null;
  if (n.includes("lunar") || n.includes("moon")) return "lunar";
  if (n.includes("solar") || n.includes("sun")) return "solar";
  return null;
}

/** NASA image library assets ship a small ~thumb variant — plenty for a 56px circle */
function toThumbnailUrl(url: string): string {
  if (url.includes("images-assets.nasa.gov")) {
    return url.replace(/~(orig|large|medium|small)\./, "~thumb.");
  }
  return url;
}

/** Eclipse photo with fallback chain: thumbnail → full image → gradient with icon */
const EclipseImage = ({
  imageUrl,
  label,
  icon,
  accent,
  isObserved,
}: {
  imageUrl: string | null;
  label: string;
  icon: string;
  accent: string;
  isObserved: boolean;
}) => {
  const [failedThumb, setFailedThumb] = useState(false);
  const [failedFull, setFailedFull] = useState(false);

  if (!imageUrl || failedFull) {
    return (
      <div
        className={`w-14 h-14 rounded-full bg-gradient-to-br ${accent} flex items-center justify-center ${
          isObserved ? "" : "grayscale"
        }`}
      >
        <i className={`fas ${icon} text-star-white/80`} />
      </div>
    );
  }

  return (
    <img
      src={failedThumb ? imageUrl : toThumbnailUrl(imageUrl)}
      alt={label}
      loading="lazy"
      className={`w-14 h-14 rounded-full object-cover ${isObserved ? "" : "grayscale"}`}
      onError={() => (failedThumb ? setFailedFull(true) : setFailedThumb(true))}
    />
  );
};

/** Most recent observation date, formatted for display. */
function formatLatest(dates: string[]): string | null {
  if (dates.length === 0) return null;
  const latest = dates.slice().sort().reverse()[0];
  // plannedDate is a bare YYYY-MM-DD; parse as local so the day doesn't shift
  const [y, m, d] = latest.split("T")[0].split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const EclipseTracker = ({ celestialObjects, observations }: EclipseTrackerProps) => {
  // Catalog objects that represent an eclipse, indexed by kind
  const imageByKind = new Map<EclipseKey, string | null>();
  const kindByObjectId = new Map<number, EclipseKey>();

  celestialObjects.forEach((obj) => {
    const kind = eclipseKindOf(obj.name);
    if (!kind) return;
    kindByObjectId.set(obj.id, kind);
    // Keep the first image found for this kind
    if (!imageByKind.get(kind)) imageByKind.set(kind, obj.imageUrl);
  });

  // Count observations per eclipse kind, collecting dates so we can show the latest.
  // Eclipses recur, so these are counts rather than a one-time checkmark.
  const datesByKind = new Map<EclipseKey, string[]>();

  observations.forEach((obs) => {
    if (!obs.isObserved) return;
    const kind =
      (obs.objectId != null ? kindByObjectId.get(obs.objectId) : undefined) ??
      eclipseKindOf(obs.celestialObject?.name);
    if (!kind) return;
    const date = (obs.plannedDate as unknown as string) || (obs.dateAdded as unknown as string);
    const list = datesByKind.get(kind) || [];
    if (date) list.push(date);
    datesByKind.set(kind, list);
  });

  const totalSeen = ECLIPSES.reduce(
    (sum, e) => sum + (datesByKind.get(e.key)?.length || 0),
    0
  );

  return (
    <div className="mt-8 pt-6 border-t border-cosmic-purple/30">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-star-dim">Eclipses Seen</span>
        <span className="text-sm font-medium text-stellar-gold">{totalSeen}</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {ECLIPSES.map((eclipse) => {
          const dates = datesByKind.get(eclipse.key) || [];
          const count = dates.length;
          const isObserved = count > 0;
          const latest = formatLatest(dates);

          return (
            <div
              key={eclipse.key}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                isObserved
                  ? "bg-space-blue-dark border-green-500/40"
                  : "bg-space-blue-dark/50 border-cosmic-purple/30 opacity-50"
              }`}
            >
              <EclipseImage
                imageUrl={imageByKind.get(eclipse.key) ?? null}
                label={eclipse.label}
                icon={eclipse.icon}
                accent={eclipse.accent}
                isObserved={isObserved}
              />
              <span
                className={`text-sm font-medium ${
                  isObserved ? "text-star-white" : "text-star-dim"
                }`}
              >
                {eclipse.label}
              </span>
              <span className="text-xs text-star-dim">
                {isObserved ? (latest ? `${count}× · ${latest}` : `${count}×`) : "Not yet seen"}
              </span>
              {isObserved && (
                <div className="absolute top-2 right-2 bg-green-500 rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
                  <Check className="h-3 w-3 text-white" />
                  {count > 1 && <span className="text-[10px] text-white font-medium">{count}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EclipseTracker;
