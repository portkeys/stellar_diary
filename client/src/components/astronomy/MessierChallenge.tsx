import { useState, useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { Check } from "lucide-react";
import type { CelestialObject, Observation } from "@shared/schema";

interface MessierChallengeProps {
  celestialObjects: CelestialObject[];
  observations: (Observation & { celestialObject?: any })[];
}

type MessierType = "all" | "galaxy" | "nebula" | "star_cluster" | "other";
type StatusFilter = "all" | "observed" | "not_observed";

const TYPE_LABELS: Record<string, string> = {
  galaxy: "Galaxy",
  nebula: "Nebula",
  star_cluster: "Star Cluster",
  other: "Other",
};

/** Extract Messier number from a name like "Crab Nebula (M1)" or "M42" */
function extractMessierNumber(name: string): number | null {
  const match = name.match(/\bM\s*(\d{1,3})\b/i);
  return match ? parseInt(match[1], 10) : null;
}

const MessierChallenge = ({ celestialObjects, observations }: MessierChallengeProps) => {
  const [typeFilter, setTypeFilter] = useState<MessierType>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Build set of observed object IDs
  const observedObjectIds = useMemo(
    () => new Set(observations.filter((o) => o.isObserved).map((o) => o.objectId)),
    [observations]
  );

  // Get all Messier objects from celestial objects
  const messierObjects = useMemo(() => {
    return celestialObjects
      .map((obj) => {
        const mNum = extractMessierNumber(obj.name);
        return mNum ? { ...obj, messierNumber: mNum } : null;
      })
      .filter((obj): obj is CelestialObject & { messierNumber: number } => obj !== null)
      .sort((a, b) => a.messierNumber - b.messierNumber);
  }, [celestialObjects]);

  const observedCount = messierObjects.filter((obj) => observedObjectIds.has(obj.id)).length;
  const progressPercent = messierObjects.length > 0 ? (observedCount / messierObjects.length) * 100 : 0;

  // Type breakdown
  const typeBreakdown = useMemo(() => {
    const counts: Record<string, { total: number; observed: number }> = {};
    messierObjects.forEach((obj) => {
      const type = obj.type || "other";
      if (!counts[type]) counts[type] = { total: 0, observed: 0 };
      counts[type].total++;
      if (observedObjectIds.has(obj.id)) counts[type].observed++;
    });
    return counts;
  }, [messierObjects, observedObjectIds]);

  // Filtered list
  const filteredObjects = useMemo(() => {
    return messierObjects.filter((obj) => {
      if (typeFilter !== "all" && obj.type !== typeFilter) return false;
      if (statusFilter === "observed" && !observedObjectIds.has(obj.id)) return false;
      if (statusFilter === "not_observed" && observedObjectIds.has(obj.id)) return false;
      return true;
    });
  }, [messierObjects, typeFilter, statusFilter, observedObjectIds]);

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-star-dim">Messier Objects Observed</span>
          <span className="text-sm font-medium text-stellar-gold">
            {observedCount} / {messierObjects.length}
          </span>
        </div>
        <Progress value={progressPercent} className="h-3" />
      </div>

      {/* Type breakdown badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(typeBreakdown).map(([type, { total, observed }]) => (
          <span
            key={type}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-space-blue-dark border border-cosmic-purple/30"
          >
            <span className="text-star-dim">{TYPE_LABELS[type] || type}:</span>
            <span className="text-stellar-gold font-medium">
              {observed}/{total}
            </span>
          </span>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs text-star-dim">Type:</span>
          <div className="flex gap-1">
            {(["all", "galaxy", "nebula", "star_cluster", "other"] as MessierType[]).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                  typeFilter === t
                    ? "bg-cosmic-purple text-star-white"
                    : "bg-space-blue-dark text-star-dim hover:text-star-white"
                }`}
              >
                {t === "all" ? "All" : TYPE_LABELS[t] || t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-star-dim">Status:</span>
          <div className="flex gap-1">
            {(["all", "observed", "not_observed"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                  statusFilter === s
                    ? "bg-cosmic-purple text-star-white"
                    : "bg-space-blue-dark text-star-dim hover:text-star-white"
                }`}
              >
                {s === "all" ? "All" : s === "observed" ? "Observed" : "Not Observed"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messier grid */}
      {filteredObjects.length === 0 ? (
        <p className="text-center text-star-dim py-8 text-sm">
          {statusFilter === "observed"
            ? "No Messier objects observed yet in this category. Keep exploring!"
            : "No matching objects found."}
        </p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {filteredObjects.map((obj) => {
            const isObserved = observedObjectIds.has(obj.id);
            return (
              <div
                key={obj.id}
                className={`relative rounded-lg overflow-hidden border transition-all ${
                  isObserved
                    ? "border-green-500/40"
                    : "border-cosmic-purple/20 opacity-60"
                }`}
              >
                {/* Thumbnail */}
                {obj.imageUrl ? (
                  <img
                    src={obj.imageUrl}
                    alt={obj.name}
                    className={`w-full aspect-square object-cover ${
                      isObserved ? "" : "grayscale"
                    }`}
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full aspect-square bg-space-blue-dark flex items-center justify-center">
                    <i className="fas fa-star text-cosmic-purple/40 text-2xl" />
                  </div>
                )}

                {/* Label overlay */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
                  <p className="text-xs font-bold text-star-white">
                    M{obj.messierNumber}
                  </p>
                  <p className="text-[10px] text-star-dim truncate">
                    {obj.name.replace(/\s*\(M\d+\)\s*/, "")}
                  </p>
                </div>

                {/* Observed check */}
                {isObserved && (
                  <div className="absolute top-1.5 right-1.5 bg-green-500 rounded-full p-0.5">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {observedCount === 0 && statusFilter === "all" && typeFilter === "all" && (
        <p className="text-center text-star-dim mt-6 text-sm">
          The Messier catalog contains 110 of the most spectacular deep sky objects.
          Start observing and track your progress toward completing the full catalog!
        </p>
      )}

      {observedCount === messierObjects.length && messierObjects.length > 0 && (
        <p className="text-center text-stellar-gold mt-6 text-sm font-medium">
          You've completed the entire Messier catalog! An incredible achievement!
        </p>
      )}
    </div>
  );
};

export default MessierChallenge;
