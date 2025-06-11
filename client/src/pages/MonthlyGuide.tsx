import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CelestialObject, MonthlyGuide } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CelestialCard from "@/components/astronomy/CelestialCard";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Extract YouTube video ID from URL
const getYouTubeVideoId = (url: string) => {
  // Handle both standard URLs and URLs with additional parameters
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Component to render a YouTube video embed
interface YouTubeEmbedProps {
  videoUrl: string;
  title?: string;
}

const YouTubeEmbed = ({ videoUrl, title = "YouTube video" }: YouTubeEmbedProps) => {
  const videoId = getYouTubeVideoId(videoUrl);
  
  if (!videoId) return null;
  
  return (
    <div className="relative w-full rounded-lg overflow-hidden mb-4" style={{ paddingBottom: '56.25%' }}> {/* 16:9 aspect ratio */}
      <iframe 
        src={`https://www.youtube.com/embed/${videoId}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute top-0 left-0 w-full h-full"
      ></iframe>
    </div>
  );
};

const MonthlyGuidePage = () => {
  const [hemisphere, setHemisphere] = useState<string>("Northern");
  const [objectType, setObjectType] = useState<string | null>(null);
  const [newVideoUrl, setNewVideoUrl] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState<boolean>(false); // Toggle for admin mode
  const { toast } = useToast();
  
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
            <div 
              className="text-star-dim prose prose-invert max-w-none [&_strong]:text-stellar-gold [&_strong]:font-semibold"
              dangerouslySetInnerHTML={{
                __html: guide.description
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\n\n/g, '</p><p>')
                  .replace(/^(.*)$/gm, '<p>$1</p>')
                  .replace(/<p><\/p>/g, '')
              }}
            />
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
      
      {/* Videos Section */}
      {guide && guide.videoUrls && guide.videoUrls.length > 0 && (
        <div className="mb-10">
          <h2 className="text-2xl text-space font-bold mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block text-stellar-gold mr-2"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg> Featured Videos
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {guide.videoUrls.map((videoUrl, index) => (
              <div key={index} className="bg-space-blue rounded-xl shadow-xl overflow-hidden">
                <YouTubeEmbed 
                  videoUrl={videoUrl} 
                  title={`${currentMonth} ${currentYear} Sky Guide - Video ${index + 1}`}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Admin Controls - Only visible when admin mode is toggled */}
      <div className="mb-10">
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            className={isAdmin ? "bg-nebula-pink text-white" : "border-nebula-pink text-nebula-pink"}
            onClick={() => setIsAdmin(!isAdmin)}
          >
            {isAdmin ? "Exit Admin Mode" : "Admin Mode"}
          </Button>
        </div>
        
        {isAdmin && guide && (
          <div className="bg-space-blue rounded-lg p-6 mb-8">
            <h3 className="text-xl text-nebula-pink font-semibold mb-4">Manage Monthly Guide Videos</h3>
            
            {/* Add video URL form */}
            <div className="flex gap-2 mb-6">
              <Input
                type="text"
                placeholder="Enter YouTube URL"
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                className="flex-1 bg-space-blue-dark border-cosmic-purple"
              />
              <Button
                onClick={async () => {
                  if (!newVideoUrl) return;
                  
                  // Validate URL
                  if (!getYouTubeVideoId(newVideoUrl)) {
                    toast({
                      title: "Invalid YouTube URL",
                      description: "Please enter a valid YouTube video URL",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  try {
                    // Create a new array with existing videos plus the new one
                    const updatedVideoUrls = [...(guide.videoUrls || []), newVideoUrl];
                    
                    // Update the guide with the new video list
                    await apiRequest(
                      "PATCH",
                      `/api/monthly-guide/${guide.id}`, 
                      { videoUrls: updatedVideoUrls }
                    );
                    
                    // Clear the input field
                    setNewVideoUrl("");
                    
                    // Invalidate the query to refresh the data
                    queryClient.invalidateQueries({ 
                      queryKey: [`/api/monthly-guide?month=${currentMonth}&hemisphere=${hemisphere}`] 
                    });
                    
                    toast({
                      title: "Video Added",
                      description: "The video has been added to the monthly guide",
                    });
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Failed to add video. Please try again.",
                      variant: "destructive"
                    });
                  }
                }}
                className="bg-cosmic-purple hover:bg-cosmic-purple-light"
              >
                Add Video
              </Button>
            </div>
            
            {/* Current videos list with remove buttons */}
            {guide.videoUrls && guide.videoUrls.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-md font-medium text-star-bright mb-2">Current Videos:</h4>
                {guide.videoUrls.map((videoUrl, index) => (
                  <div key={index} className="flex justify-between items-center bg-space-blue-dark p-3 rounded">
                    <div className="truncate flex-1 mr-2">{videoUrl}</div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={async () => {
                        try {
                          // Filter out the video being removed
                          const updatedVideoUrls = guide.videoUrls?.filter((_, idx) => idx !== index);
                          
                          // Update the guide with the filtered video list
                          await apiRequest(
                            "PATCH",
                            `/api/monthly-guide/${guide.id}`,
                            { videoUrls: updatedVideoUrls }
                          );
                          
                          // Invalidate the query to refresh the data
                          queryClient.invalidateQueries({ 
                            queryKey: [`/api/monthly-guide?month=${currentMonth}&hemisphere=${hemisphere}`] 
                          });
                          
                          toast({
                            title: "Video Removed",
                            description: "The video has been removed from the monthly guide",
                          });
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to remove video. Please try again.",
                            variant: "destructive"
                          });
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-star-dim italic">No videos added yet. Add a YouTube URL to get started.</p>
            )}
          </div>
        )}
      </div>
      
      {/* Celestial Objects Grid */}
      <div className="mb-10">
        <h2 className="text-2xl text-space font-bold mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block text-stellar-gold mr-2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> Objects to Observe
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
