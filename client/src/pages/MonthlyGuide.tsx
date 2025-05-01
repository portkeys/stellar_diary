import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CelestialObject, MonthlyGuide } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CelestialCard from "@/components/astronomy/CelestialCard";

const MonthlyGuidePage = () => {
  const [hemisphere, setHemisphere] = useState<string>("Northern");
  const [objectType, setObjectType] = useState<string | null>(null);
  
  // Get current month name
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear();
  
  // Fetch monthly guide info
  const { data: guide, isLoading: isGuideLoading, isError: isGuideError } = useQuery<MonthlyGuide>({
    queryKey: [`/api/monthly-guide?month=${currentMonth}&hemisphere=${hemisphere}`],
    // Continue even if the monthly guide is not found
    retry: false
  });
  
  // Construct query string for celestial objects
  const queryParams = new URLSearchParams();
  if (hemisphere) queryParams.append('hemisphere', hemisphere);
  if (objectType) queryParams.append('type', objectType);
  queryParams.append('month', currentMonth);
  
  // Fetch celestial objects
  const { data: celestialObjects, isLoading: isObjectsLoading, isError: isObjectsError } = useQuery<CelestialObject[]>({
    queryKey: [`/api/celestial-objects?${queryParams.toString()}`],
  });
  
  // Query for celestial object types (for filter dropdown)
  const { data: objectTypes } = useQuery<string[]>({
    queryKey: ['/api/celestial-object-types'],
  });
  
  const isLoading = isGuideLoading || isObjectsLoading;
  const isError = isObjectsError; // Use the objects error state for the main error display
  
  const handleHemisphereChange = (value: string) => {
    setHemisphere(value);
  };
  
  const handleFilterChange = (value: string) => {
    setObjectType(value === 'all' ? null : value);
  };
  
  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-8">
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-4xl text-space font-bold text-stellar-gold mb-3">
          Monthly Sky Guide: {currentMonth} {currentYear}
        </h1>
        
        {isGuideLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : guide ? (
          <div className="bg-space-blue rounded-lg p-4 shadow-md">
            <h2 className="text-xl text-space text-nebula-pink mb-2">{guide.headline}</h2>
            <p className="text-star-dim">{guide.description}</p>
          </div>
        ) : (
          <div className="bg-space-blue rounded-lg p-4 shadow-md">
            <h2 className="text-xl text-space text-nebula-pink mb-2">
              {hemisphere === "Northern" 
                ? "Northern Hemisphere Viewing Guide" 
                : "Southern Hemisphere Viewing Guide"}
            </h2>
            <p className="text-star-dim">
              Discover the best celestial objects to observe this month with your 8-inch Dobsonian telescope.
            </p>
          </div>
        )}
      </div>
      
      {/* Filter Controls */}
      <div className="mb-8 flex flex-wrap gap-4 items-center justify-between bg-space-blue-dark p-4 rounded-lg">
        <div className="text-lg text-space font-medium">
          Filter Objects
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Select onValueChange={handleFilterChange} defaultValue="all">
            <SelectTrigger className="bg-cosmic-purple hover:bg-cosmic-purple-light px-4 py-2 rounded-md text-sm w-[180px]">
              <i className="fas fa-filter mr-1"></i>
              <SelectValue placeholder="Object Type" />
            </SelectTrigger>
            <SelectContent className="bg-space-blue border border-cosmic-purple">
              <SelectItem value="all">All Object Types</SelectItem>
              {objectTypes?.map(type => (
                <SelectItem key={type} value={type}>
                  {type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select onValueChange={handleHemisphereChange} defaultValue={hemisphere}>
            <SelectTrigger className="bg-space-blue border border-cosmic-purple rounded-md py-2 pl-3 pr-8 text-sm w-[180px]">
              <SelectValue placeholder="Hemisphere" />
            </SelectTrigger>
            <SelectContent className="bg-space-blue border border-cosmic-purple">
              <SelectItem value="Northern">Northern Hemisphere</SelectItem>
              <SelectItem value="Southern">Southern Hemisphere</SelectItem>
              <SelectItem value="Both">Both Hemispheres</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            className="border-nebula-pink text-nebula-pink hover:bg-nebula-pink hover:bg-opacity-10"
            onClick={() => {
              setObjectType(null);
              setHemisphere("Northern");
            }}
          >
            <i className="fas fa-sync-alt mr-1"></i> Reset
          </Button>
        </div>
      </div>
      
      {/* Celestial Objects Grid */}
      <div className="mb-10">
        <h2 className="text-2xl text-space font-bold mb-6">
          <i className="fas fa-star text-stellar-gold mr-2"></i> Objects to Observe
        </h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((_, index) => (
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
        ) : celestialObjects && celestialObjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {celestialObjects.map(object => (
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
      </div>
    </div>
  );
};

export default MonthlyGuidePage;
