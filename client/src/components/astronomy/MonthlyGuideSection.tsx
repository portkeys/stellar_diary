import { useQuery } from "@tanstack/react-query";
import { CelestialObject, MonthlyGuide } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import CelestialCard from "./CelestialCard";
import { Link } from "wouter";

const MonthlyGuideSection = () => {
  // Get current month name and year
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear();
  
  // Construct query string for featured objects only
  const queryParams = new URLSearchParams();
  queryParams.append('hemisphere', 'Northern');
  queryParams.append('month', currentMonth);
  
  const { data: celestialObjects, isLoading, isError } = useQuery<CelestialObject[]>({
    queryKey: [`/api/celestial-objects?${queryParams.toString()}`],
  });

  // Query for monthly guide content
  const { data: monthlyGuide, isLoading: guideLoading } = useQuery<MonthlyGuide>({
    queryKey: [`/api/monthly-guide?hemisphere=Northern`],
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
          <i className="fas fa-moon text-stellar-gold mr-2"></i> {currentMonth} {currentYear}: Objects to Observe
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
          {/* Monthly Guide Summary */}
          {monthlyGuide && !guideLoading ? (
            <div className="bg-space-blue rounded-xl shadow-xl p-6 mb-8">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-stellar-gold mb-2">
                  {monthlyGuide.headline}
                </h3>
                <p className="text-star-dim text-sm mb-4">
                  Featured celestial objects and viewing opportunities for {currentMonth} {currentYear}. Content imported from: 
                  <br />
                  <span className="text-xs opacity-75">
                    https://www.highpointscientific.com/astronomy-hub/post/night-sky-news/whats-in-the-sky-this-month-
                  </span>
                </p>
                <div className="text-gray-300 leading-relaxed">
                  {monthlyGuide.description && monthlyGuide.description.split('\n').slice(0, 3).map((paragraph, index) => (
                    <p key={index} className="mb-3 text-sm">
                      {paragraph.trim()}
                    </p>
                  ))}
                </div>
              </div>
              
              {/* Featured Objects Preview */}
              {featuredObjects.length > 0 && (
                <div className="border-t border-cosmic-purple pt-4">
                  <h4 className="text-lg font-medium text-stellar-gold mb-3">Featured Objects</h4>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {featuredObjects.map(object => (
                      <span key={object.id} className="bg-cosmic-purple px-3 py-1 rounded-full text-sm">
                        {object.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-space-blue rounded-xl shadow-xl p-6 mb-8">
              <div className="animate-pulse">
                <div className="h-6 bg-cosmic-purple rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-cosmic-purple rounded w-full mb-2"></div>
                <div className="h-4 bg-cosmic-purple rounded w-5/6 mb-2"></div>
                <div className="h-4 bg-cosmic-purple rounded w-4/5"></div>
              </div>
            </div>
          )}
          
          <div className="text-center">
            <Link href="/monthly-guide">
              <Button className="bg-cosmic-purple hover:bg-cosmic-purple-light px-6 py-3 rounded-lg font-medium">
                View Full Guide <i className="fas fa-arrow-right ml-2"></i>
              </Button>
            </Link>
          </div>
        </>
      )}
    </section>
  );
};

export default MonthlyGuideSection;