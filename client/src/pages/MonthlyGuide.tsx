import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CelestialObject, MonthlyGuide } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CelestialCard from "@/components/astronomy/CelestialCard";

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

  if (!videoId) {
    return (
      <div className="relative w-full rounded-lg overflow-hidden mb-4 bg-space-blue-dark border border-cosmic-purple" style={{ paddingBottom: '56.25%' }}>
        <div className="absolute inset-0 flex items-center justify-center text-star-dim">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-2 text-cosmic-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">Video unavailable</p>
          </div>
        </div>
      </div>
    );
  }

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

  // Get current month name
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear();

  // Fetch monthly guide info
  const { data: guide, isLoading: isGuideLoading } = useQuery<MonthlyGuide>({
    queryKey: [`/api/monthly-guide?month=${currentMonth}&hemisphere=${hemisphere}`],
    retry: false,
    throwOnError: false
  });

  // Fetch celestial objects linked to this guide
  const { data: celestialObjects, isLoading: isObjectsLoading, isError: isObjectsError } = useQuery<CelestialObject[]>({
    queryKey: [`/api/monthly-guide/${guide?.id}/objects`],
    enabled: !!guide?.id,
  });

  // Filter objects by type if filter is set
  const filteredObjects = objectType
    ? celestialObjects?.filter(obj => obj.type === objectType)
    : celestialObjects;

  // Query for celestial object types (for filter dropdown)
  const { data: objectTypes } = useQuery<string[]>({
    queryKey: ['/api/celestial-object-types'],
  });

  const isLoading = isGuideLoading || isObjectsLoading;
  const isError = isObjectsError;

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
        {guide?.description && (
          <p className="text-star-dim text-lg">{guide.description}</p>
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
        ) : filteredObjects && filteredObjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredObjects.map(object => (
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
