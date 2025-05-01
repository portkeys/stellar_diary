import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CelestialObject } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CelestialCard from "./CelestialCard";

const MonthlyGuideSection = () => {
  const [hemisphere, setHemisphere] = useState<string>("Northern");
  const [objectType, setObjectType] = useState<string | null>(null);
  
  // Get current month name
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear();
  
  // Construct query string
  const queryParams = new URLSearchParams();
  if (hemisphere) queryParams.append('hemisphere', hemisphere);
  if (objectType) queryParams.append('type', objectType);
  queryParams.append('month', currentMonth);
  
  const { data: celestialObjects, isLoading, isError } = useQuery<CelestialObject[]>({
    queryKey: [`/api/celestial-objects?${queryParams.toString()}`],
  });
  
  // Query for celestial object types (for filter dropdown)
  const { data: objectTypes } = useQuery<string[]>({
    queryKey: ['/api/celestial-object-types'],
  });
  
  const handleHemisphereChange = (value: string) => {
    setHemisphere(value);
  };
  
  const handleFilterChange = (value: string) => {
    setObjectType(value === 'all' ? null : value);
  };
  
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
          <i className="fas fa-moon text-stellar-gold mr-2"></i> {currentMonth} {currentYear}: What to Observe
        </h2>
        <div className="flex items-center space-x-3">
          <Select onValueChange={handleFilterChange} defaultValue="all">
            <SelectTrigger className="bg-cosmic-purple hover:bg-cosmic-purple-light px-4 py-2 rounded-md text-sm w-auto">
              <i className="fas fa-filter mr-1"></i>
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent className="bg-space-blue border border-cosmic-purple">
              <SelectItem value="all">All Objects</SelectItem>
              {objectTypes?.map(type => (
                <SelectItem key={type} value={type}>
                  {type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select onValueChange={handleHemisphereChange} defaultValue={hemisphere}>
            <SelectTrigger className="bg-space-blue border border-cosmic-purple rounded-md py-2 pl-3 pr-8 text-sm w-auto">
              <SelectValue placeholder="Hemisphere" />
            </SelectTrigger>
            <SelectContent className="bg-space-blue border border-cosmic-purple">
              <SelectItem value="Northern">Northern Hemisphere</SelectItem>
              <SelectItem value="Southern">Southern Hemisphere</SelectItem>
              <SelectItem value="Both">Both Hemispheres</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
          {celestialObjects && celestialObjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {celestialObjects.slice(0, 2).map(object => (
                <CelestialCard key={object.id} celestialObject={object} />
              ))}
            </div>
          ) : (
            <div className="bg-space-blue rounded-xl shadow-xl p-6 text-center">
              <div className="flex flex-col items-center">
                <i className="fas fa-search text-4xl text-nebula-pink mb-4"></i>
                <h3 className="text-xl font-semibold mb-2">No celestial objects found</h3>
                <p className="text-star-dim mb-4">
                  There are no objects matching your current filters. Try changing the filters or check back next month!
                </p>
                <Button 
                  variant="default" 
                  className="bg-cosmic-purple hover:bg-cosmic-purple-light"
                  onClick={() => {
                    setObjectType(null);
                    setHemisphere("Northern");
                  }}
                >
                  <i className="fas fa-filter mr-2"></i> Reset Filters
                </Button>
              </div>
            </div>
          )}
          
          <div className="mt-8 text-center">
            <Button className="bg-cosmic-purple hover:bg-cosmic-purple-light px-6 py-3 rounded-lg font-medium">
              View All {currentMonth} Celestial Events <i className="fas fa-arrow-right ml-2"></i>
            </Button>
          </div>
        </>
      )}
    </section>
  );
};

export default MonthlyGuideSection;
