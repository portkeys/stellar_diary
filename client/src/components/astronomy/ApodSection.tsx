import { useQuery } from "@tanstack/react-query";
import { ApodResponse } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { queryClient } from "@/lib/queryClient";

const ApodSection = () => {
  const [showFullExplanation, setShowFullExplanation] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Define query options with proper typing
  const { data: apod, isLoading, isError, refetch } = useQuery<ApodResponse>({
    queryKey: ['/api/apod'],
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes only
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gets focus again
    // Adding refetch interval to ensure fresh data
    refetchInterval: 1000 * 60 * 60, // Refetch every hour
  });
  
  // Function to manually refresh APOD with force flag
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.fetchQuery({
        queryKey: ['/api/apod'],
        queryFn: async () => {
          const response = await fetch('/api/apod?refresh=true');
          if (!response.ok) {
            throw new Error('Failed to refresh APOD');
          }
          return response.json();
        }
      });
    } catch (error) {
      console.error('Error refreshing APOD:', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Force refetch at midnight to get the new APOD
  useEffect(() => {
    // Calculate time until midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    // Set up a timer to refetch at midnight (with force refresh)
    const timer = setTimeout(() => {
      handleManualRefresh();
    }, timeUntilMidnight);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (isLoading) {
    return (
      <section className="my-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl text-space font-bold">
            <i className="fas fa-camera-retro text-stellar-gold mr-2"></i> NASA Astronomy Picture of the Day
          </h2>
          <Button variant="ghost" className="text-star-dim hover:text-star-white">
            <i className="fas fa-calendar-alt mr-1"></i> Archive
          </Button>
        </div>
        
        <div className="bg-space-blue rounded-xl shadow-xl overflow-hidden">
          <div className="relative">
            <Skeleton className="w-full h-[400px] md:h-[500px]" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-space-blue-dark to-transparent h-40"></div>
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-space-blue-dark bg-opacity-90 backdrop-blur-sm p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
                <Skeleton className="h-20 w-full mb-3" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-1/3" />
                  <div className="flex space-x-2">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
  
  if (isError || !apod) {
    return (
      <section className="my-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl text-space font-bold">
            <i className="fas fa-camera-retro text-stellar-gold mr-2"></i> NASA Astronomy Picture of the Day
          </h2>
        </div>
        
        <div className="bg-space-blue rounded-xl shadow-xl overflow-hidden p-6 text-center">
          <div className="flex flex-col items-center">
            <i className="fas fa-satellite-dish text-4xl text-nebula-pink mb-4"></i>
            <h3 className="text-xl font-semibold mb-2">Unable to load today's astronomy picture</h3>
            <p className="text-star-dim mb-4">There was an error connecting to the NASA APOD API. Please try again later.</p>
            <Button 
              variant="default" 
              className="bg-cosmic-purple hover:bg-cosmic-purple-light"
              onClick={() => window.location.reload()}
            >
              <i className="fas fa-sync-alt mr-2"></i> Retry
            </Button>
          </div>
        </div>
      </section>
    );
  }
  
  // Format date for display
  // Make sure to display the date in correct format - April 30, 2025
  const [year, month, day] = apod.date.split('-');
  const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Truncate explanation if it's too long
  const shouldTruncate = apod.explanation.length > 300;
  const truncatedExplanation = shouldTruncate && !showFullExplanation 
    ? apod.explanation.substring(0, 300) + '...' 
    : apod.explanation;
  
  return (
    <section className="my-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl text-space font-bold">
          <i className="fas fa-camera-retro text-stellar-gold mr-2"></i> NASA Astronomy Picture of the Day
        </h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            className="text-star-dim hover:text-star-white"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
          >
            <i className={`fas ${isRefreshing ? 'fa-spinner fa-spin' : 'fa-sync-alt'} mr-1`}></i> 
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant="ghost" className="text-star-dim hover:text-star-white">
            <i className="fas fa-calendar-alt mr-1"></i> Archive
          </Button>
        </div>
      </div>
      
      <div className="bg-space-blue rounded-xl shadow-xl overflow-hidden">
        <div className="relative">
          {apod.media_type === 'image' ? (
            <img 
              src={apod.url} 
              alt={apod.title} 
              className="w-full h-[400px] md:h-[500px] object-cover"
            />
          ) : apod.media_type === 'video' ? (
            <div className="relative w-full h-[400px] md:h-[500px]">
              <iframe 
                src={apod.url} 
                title={apod.title}
                className="absolute inset-0 w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          ) : (
            <div className="w-full h-[400px] md:h-[500px] flex items-center justify-center bg-space-blue-dark">
              <p className="text-lg text-star-dim">Media type not supported</p>
            </div>
          )}
          
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-space-blue-dark to-transparent h-40"></div>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-space-blue-dark bg-opacity-90 backdrop-blur-sm p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl text-space font-semibold text-stellar-gold">
                  {apod.title}
                </h3>
                <span className="text-star-dim text-sm">{formattedDate}</span>
              </div>
              <p className="text-sm mb-3">
                {truncatedExplanation}
                {shouldTruncate && (
                  <button 
                    className="text-nebula-pink hover:text-opacity-80 ml-1"
                    onClick={() => setShowFullExplanation(!showFullExplanation)}
                  >
                    {showFullExplanation ? 'Show less' : 'Read more'}
                  </button>
                )}
              </p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-star-dim">
                  {apod.copyright ? `© ${apod.copyright} - ` : ''}Image Credit & Copyright: NASA
                </span>
                <div className="flex space-x-2">
                  <button className="text-nebula-pink hover:text-opacity-80">
                    <i className="fas fa-heart"></i>
                  </button>
                  <button className="text-stellar-gold hover:text-opacity-80">
                    <i className="fas fa-share-alt"></i>
                  </button>
                  <button className="text-star-white hover:text-opacity-80">
                    <i className="fas fa-info-circle"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ApodSection;
