import { useQuery } from "@tanstack/react-query";
import { CelestialObject } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import CelestialCard from "./CelestialCard";
import { Link } from "wouter";

const MonthlyGuideSection = () => {
  // Get current month name
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  
  // Construct query string for featured objects only
  const queryParams = new URLSearchParams();
  queryParams.append('hemisphere', 'Northern');
  queryParams.append('month', currentMonth);
  
  const { data: celestialObjects, isLoading, isError } = useQuery<CelestialObject[]>({
    queryKey: [`/api/celestial-objects?${queryParams.toString()}`],
  });

  // Limit to 3 featured objects for the home page
  const featuredObjects = celestialObjects?.slice(0, 3) || [];

  const renderSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((_, index) => (
        <div key={index} className="bg-space-blue rounded-xl shadow-xl overflow-hidden">
          <Skeleton className="w-full h-48" />
          <div className="p-4">
            <div className="flex justify-between items-start mb-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-20 w-full mb-4" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
  
  return (
    <section className="my-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl text-space font-bold">
          <i className="fas fa-moon text-stellar-gold mr-2"></i> Featured Objects This Month
        </h2>
      </div>
      
      {isLoading ? (
        renderSkeleton()
      ) : isError ? (
        <div className="bg-space-blue rounded-xl shadow-xl p-6 text-center">
          <div className="flex flex-col items-center">
            <i className="fas fa-satellite-dish text-4xl text-nebula-pink mb-4"></i>
            <h3 className="text-xl font-semibold mb-2">Unable to load celestial objects</h3>
            <p className="text-star-dim mb-4">There was an error fetching the monthly guide data. Please try again later.</p>
            <Button 
              variant="default" 
              className="bg-cosmic-purple hover:bg-cosmic-purple-light"
              onClick={() => window.location.reload()}
            >
              <i className="fas fa-sync-alt mr-2"></i> Retry
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Featured Objects Grid */}
          {featuredObjects.length > 0 ? (
            <div>
              <div className="mb-6">
                <p className="text-star-dim text-sm">
                  Discover the best celestial objects to observe this month. Click on any object to add it to your observation list.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredObjects.map(object => (
                  <CelestialCard key={object.id} celestialObject={object} />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-space-blue rounded-xl shadow-xl p-6 text-center">
              <div className="flex flex-col items-center">
                <i className="fas fa-search text-4xl text-nebula-pink mb-4"></i>
                <h3 className="text-xl font-semibold mb-2">No featured objects this month</h3>
                <p className="text-star-dim mb-4">
                  Check back soon for new celestial objects to observe this month!
                </p>
              </div>
            </div>
          )}
          
          <div className="mt-8 text-center">
            <Link href="/monthly-guide">
              <Button className="bg-cosmic-purple hover:bg-cosmic-purple-light px-6 py-3 rounded-lg font-medium">
                View More <i className="fas fa-arrow-right ml-2"></i>
              </Button>
            </Link>
          </div>
        </>
      )}
    </section>
  );
};

export default MonthlyGuideSection;