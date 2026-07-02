import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SkyEvent } from "@shared/schema";

/**
 * App-wide alert shown when an anticipated sky event has triggered
 * (e.g. T CrB brightened past its nova threshold). Rendered under the navbar.
 */
const SkyEventAlertBanner = () => {
  const { data: events } = useQuery<SkyEvent[]>({
    queryKey: ["/api/sky-events"],
    staleTime: 5 * 60 * 1000,
  });

  const dismissMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/sky-events/${id}`, { status: "dismissed" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/sky-events"] }),
  });

  const triggered = (events || []).filter((e) => e.status === "triggered");
  if (triggered.length === 0) return null;

  return (
    <div className="relative z-20">
      {triggered.map((event) => (
        <div
          key={event.id}
          className="bg-gradient-to-r from-red-900/90 via-amber-800/90 to-red-900/90 border-b border-stellar-gold/50 px-4 py-3"
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <p className="text-star-white text-sm flex-1">
              <i className="fas fa-star mr-2 text-stellar-gold animate-pulse"></i>
              <span className="font-bold text-stellar-gold">{event.name} is happening!</span>
              {event.currentMagnitude != null && (
                <span> Now at magnitude {event.currentMagnitude.toFixed(1)} — go look tonight!</span>
              )}
              {event.latestNewsUrl && event.latestNewsTitle && (
                <>
                  {" "}
                  <a
                    href={event.latestNewsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2 hover:text-stellar-gold"
                  >
                    Latest news
                  </a>
                </>
              )}
            </p>
            <div className="flex items-center gap-3 shrink-0">
              <Link href="/my-observations" className="text-sm text-stellar-gold hover:underline">
                View watchlist
              </Link>
              <button
                className="text-sm text-star-dim hover:text-star-white"
                onClick={() => dismissMutation.mutate(event.id)}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkyEventAlertBanner;
