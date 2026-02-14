import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ObservationCalendar from "@/components/astronomy/ObservationCalendar";
import SolarSystemTracker from "@/components/astronomy/SolarSystemTracker";
import MessierChallenge from "@/components/astronomy/MessierChallenge";
import type { CelestialObject, Observation } from "@shared/schema";

interface EnhancedObservation extends Observation {
  celestialObject?: any;
}

/** Parse observation date to YYYY-MM-DD string, applying PST adjustment */
function getDateKey(obs: EnhancedObservation): string | null {
  const dateStr = (obs.plannedDate as unknown as string) || (obs.dateAdded as unknown as string);
  if (!dateStr) return null;
  const date = new Date(dateStr);
  // Apply PST offset (UTC-8) to avoid losing a day
  const pstDate = new Date(date.getTime() + 480 * 60000);
  return pstDate.toISOString().split("T")[0];
}

const PLANETS = ["Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"];

const MyProgress = () => {
  const { data: observations, isLoading: obsLoading } = useQuery<EnhancedObservation[]>({
    queryKey: ["/api/observations"],
  });

  const { data: celestialObjects, isLoading: objLoading } = useQuery<CelestialObject[]>({
    queryKey: ["/api/celestial-objects"],
  });

  const isLoading = obsLoading || objLoading;
  const obs = observations || [];
  const objects = celestialObjects || [];

  // Computed stats
  const { dateCountMap, totalObserved, uniqueNights, planetCount, messierCount, messierTotal } =
    useMemo(() => {
      const observed = obs.filter((o) => o.isObserved);
      const dcm = new Map<string, number>();

      observed.forEach((o) => {
        const key = getDateKey(o);
        if (key) dcm.set(key, (dcm.get(key) || 0) + 1);
      });

      // Planet count
      const observedObjectIds = new Set(observed.map((o) => o.objectId));
      const observedPlanetNames = new Set<string>();

      // Check celestialObject name on observation
      observed.forEach((o) => {
        if (o.celestialObject?.name) {
          const name = o.celestialObject.name.toLowerCase();
          PLANETS.forEach((p) => {
            if (name.includes(p.toLowerCase())) observedPlanetNames.add(p);
          });
        }
      });

      // Check celestial objects by objectId
      objects.forEach((obj) => {
        if (obj.type === "planet" && observedObjectIds.has(obj.id)) {
          const name = obj.name.toLowerCase();
          PLANETS.forEach((p) => {
            if (name.includes(p.toLowerCase())) observedPlanetNames.add(p);
          });
        }
      });

      // Messier count
      const messierObjs = objects.filter((obj) => /\bM\s*(\d{1,3})\b/i.test(obj.name));
      const messierObservedCount = messierObjs.filter((obj) =>
        observedObjectIds.has(obj.id)
      ).length;

      return {
        dateCountMap: dcm,
        totalObserved: observed.length,
        uniqueNights: dcm.size,
        planetCount: observedPlanetNames.size,
        messierCount: messierObservedCount,
        messierTotal: messierObjs.length,
      };
    }, [obs, objects]);

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-4xl text-space font-bold text-stellar-gold mb-2">My Progress</h1>
        <p className="text-star-dim text-lg">Track your observing journey</p>
      </div>

      {/* Summary stat cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-space-blue border-cosmic-purple/30">
            <CardContent className="pt-4 pb-4 px-4 text-center">
              <p className="text-3xl font-bold text-stellar-gold">{totalObserved}</p>
              <p className="text-xs text-star-dim mt-1">Total Observed</p>
            </CardContent>
          </Card>
          <Card className="bg-space-blue border-cosmic-purple/30">
            <CardContent className="pt-4 pb-4 px-4 text-center">
              <p className="text-3xl font-bold text-stellar-gold">{uniqueNights}</p>
              <p className="text-xs text-star-dim mt-1">Observing Nights</p>
            </CardContent>
          </Card>
          <Card className="bg-space-blue border-cosmic-purple/30">
            <CardContent className="pt-4 pb-4 px-4 text-center">
              <p className="text-3xl font-bold text-stellar-gold">
                {planetCount}<span className="text-lg text-star-dim">/7</span>
              </p>
              <p className="text-xs text-star-dim mt-1">Planets</p>
            </CardContent>
          </Card>
          <Card className="bg-space-blue border-cosmic-purple/30">
            <CardContent className="pt-4 pb-4 px-4 text-center">
              <p className="text-3xl font-bold text-stellar-gold">
                {messierCount}<span className="text-lg text-star-dim">/{messierTotal}</span>
              </p>
              <p className="text-xs text-star-dim mt-1">Messier</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      ) : (
        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid grid-cols-3 gap-2 bg-space-blue-dark p-1 rounded-xl mb-6">
            <TabsTrigger
              value="calendar"
              className="data-[state=active]:bg-cosmic-purple data-[state=active]:text-star-white"
            >
              <i className="fas fa-calendar-alt mr-2" />
              Calendar
            </TabsTrigger>
            <TabsTrigger
              value="solar-system"
              className="data-[state=active]:bg-cosmic-purple data-[state=active]:text-star-white"
            >
              <i className="fas fa-globe mr-2" />
              Solar System
            </TabsTrigger>
            <TabsTrigger
              value="messier"
              className="data-[state=active]:bg-cosmic-purple data-[state=active]:text-star-white"
            >
              <i className="fas fa-star mr-2" />
              Messier
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar">
            <Card className="bg-space-blue border-cosmic-purple/30">
              <CardContent className="p-6">
                {totalObserved === 0 ? (
                  <div className="text-center py-12">
                    <i className="fas fa-calendar-alt text-4xl text-cosmic-purple/40 mb-4" />
                    <h3 className="text-lg font-semibold text-star-white mb-2">
                      No observations yet
                    </h3>
                    <p className="text-star-dim text-sm max-w-md mx-auto">
                      Start recording your observations to see your activity on the calendar.
                      Every clear night is an opportunity!
                    </p>
                  </div>
                ) : (
                  <ObservationCalendar dateCountMap={dateCountMap} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="solar-system">
            <Card className="bg-space-blue border-cosmic-purple/30">
              <CardContent className="p-6">
                <SolarSystemTracker
                  celestialObjects={objects}
                  observations={obs}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messier">
            <Card className="bg-space-blue border-cosmic-purple/30">
              <CardContent className="p-6">
                <MessierChallenge
                  celestialObjects={objects}
                  observations={obs}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default MyProgress;
