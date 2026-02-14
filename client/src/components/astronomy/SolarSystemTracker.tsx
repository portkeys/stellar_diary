import { Progress } from "@/components/ui/progress";
import { Check } from "lucide-react";
import type { CelestialObject, Observation } from "@shared/schema";

interface SolarSystemTrackerProps {
  celestialObjects: CelestialObject[];
  observations: (Observation & { celestialObject?: any })[];
}

const PLANETS = [
  { name: "Mercury", color: "bg-gray-400" },
  { name: "Venus", color: "bg-yellow-200" },
  { name: "Mars", color: "bg-red-500" },
  { name: "Jupiter", color: "bg-amber-600" },
  { name: "Saturn", color: "bg-yellow-600" },
  { name: "Uranus", color: "bg-cyan-400" },
  { name: "Neptune", color: "bg-blue-500" },
];

const SolarSystemTracker = ({ celestialObjects, observations }: SolarSystemTrackerProps) => {
  // Build a set of observed planet names (lowercase)
  const observedPlanetNames = new Set<string>();

  const observedObjectIds = new Set(
    observations.filter((o) => o.isObserved).map((o) => o.objectId)
  );

  // Also check observation's celestialObject name directly
  observations.forEach((obs) => {
    if (obs.isObserved && obs.celestialObject?.name) {
      const name = obs.celestialObject.name.toLowerCase();
      PLANETS.forEach((p) => {
        if (name.includes(p.name.toLowerCase())) {
          observedPlanetNames.add(p.name.toLowerCase());
        }
      });
    }
  });

  // Check celestial objects matched by observation objectId
  celestialObjects.forEach((obj) => {
    if (obj.type === "planet" && observedObjectIds.has(obj.id)) {
      const name = obj.name.toLowerCase();
      PLANETS.forEach((p) => {
        if (name.includes(p.name.toLowerCase())) {
          observedPlanetNames.add(p.name.toLowerCase());
        }
      });
    }
  });

  const observedCount = PLANETS.filter((p) =>
    observedPlanetNames.has(p.name.toLowerCase())
  ).length;

  const progressPercent = (observedCount / PLANETS.length) * 100;

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-star-dim">Planets Observed</span>
          <span className="text-sm font-medium text-stellar-gold">
            {observedCount} / {PLANETS.length}
          </span>
        </div>
        <Progress value={progressPercent} className="h-3" />
      </div>

      {/* Planet grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {PLANETS.map((planet) => {
          const isObserved = observedPlanetNames.has(planet.name.toLowerCase());
          return (
            <div
              key={planet.name}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                isObserved
                  ? "bg-space-blue-dark border-green-500/40"
                  : "bg-space-blue-dark/50 border-cosmic-purple/30 opacity-50"
              }`}
            >
              {/* Planet circle */}
              <div
                className={`w-12 h-12 rounded-full ${planet.color} ${
                  isObserved ? "" : "grayscale"
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  isObserved ? "text-star-white" : "text-star-dim"
                }`}
              >
                {planet.name}
              </span>
              {isObserved && (
                <div className="absolute top-2 right-2 bg-green-500 rounded-full p-0.5">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {observedCount === 0 && (
        <p className="text-center text-star-dim mt-6 text-sm">
          Start observing planets and track your progress through the solar system!
        </p>
      )}

      {observedCount === PLANETS.length && (
        <p className="text-center text-stellar-gold mt-6 text-sm font-medium">
          Congratulations! You've observed all 7 planets visible from Earth!
        </p>
      )}
    </div>
  );
};

export default SolarSystemTracker;
