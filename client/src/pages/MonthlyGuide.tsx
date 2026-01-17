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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  const [newVideoUrl, setNewVideoUrl] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState<boolean>(false); // Toggle for admin mode
  const [contentUrl, setContentUrl] = useState<string>("");
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<{success: boolean, message: string, objectsAdded: number} | null>(null);
  const [showPasscodeDialog, setShowPasscodeDialog] = useState<boolean>(false);
  const [passcode, setPasscode] = useState<string>("");
  const [passcodeError, setPasscodeError] = useState<string>("");
  const { toast } = useToast();

  // Get current month name
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear();

  // Fetch monthly guide info
  const { data: guide, isLoading: isGuideLoading, isError: isGuideError } = useQuery<MonthlyGuide>({
    queryKey: [`/api/monthly-guide?month=${currentMonth}&hemisphere=${hemisphere}`],
    // Continue even if the monthly guide is not found
    retry: false,
    // Don't treat 404 as an error for admin purposes
    throwOnError: false
  });

  // Fetch celestial objects linked to this guide
  const { data: celestialObjects, isLoading: isObjectsLoading, isError: isObjectsError } = useQuery<CelestialObject[]>({
    queryKey: [`/api/monthly-guide/${guide?.id}/objects`],
    enabled: !!guide?.id, // Only fetch when we have a guide
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
  const isError = isObjectsError; // Use the objects error state for the main error display

  // Handle admin mode toggle with passcode verification
  const handleAdminModeToggle = () => {
    if (isAdmin) {
      // Exit admin mode
      setIsAdmin(false);
    } else {
      // Enter admin mode - show passcode dialog
      setShowPasscodeDialog(true);
      setPasscode("");
      setPasscodeError("");
    }
  };

  // Handle passcode verification
  const handlePasscodeSubmit = () => {
    const correctPasscode = "tutulemma";

    if (passcode === correctPasscode) {
      setIsAdmin(true);
      setShowPasscodeDialog(false);
      setPasscode("");
      setPasscodeError("");
      console.log("Admin access granted. Guide data:", guide);
      toast({
        title: "Admin Access Granted",
        description: "You now have access to admin functionality",
      });
    } else {
      setPasscodeError("Sorry, you don't have access to admin role. Incorrect passcode.");
      setPasscode("");
    }
  };

  // Handle content import from URLs
  const handleContentImport = async () => {
    if (!contentUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const response = await fetch("/api/admin/update-monthly-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: contentUrl.trim() })
      });

      const result = await response.json();
      setImportResult(result);

      if (result.success) {
        setContentUrl("");
        // Refresh the data
        queryClient.invalidateQueries({ queryKey: [`/api/monthly-guide?month=${currentMonth}&hemisphere=${hemisphere}`] });
        // Objects will be refreshed when guide is updated since query depends on guide.id

        toast({
          title: "Content Imported!",
          description: result.message,
        });
      } else {
        toast({
          title: "Import Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: "Failed to import content. Please try again.",
        objectsAdded: 0
      });
      toast({
        title: "Error",
        description: "Failed to import content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

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
      </div>

      {/* June 2025 Astronomy Highlights Summary */}
      {currentMonth === "June" && currentYear === 2025 && (
        <div className="mb-10">
          <h2 className="text-2xl text-space font-bold text-stellar-gold mb-6">
            <i className="fas fa-star text-stellar-gold mr-2"></i>
            June 2025: Astronomy Highlights
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mars, Regulus, and the Moon */}
            <div className="bg-space-blue rounded-xl shadow-xl p-6">
              <h3 className="text-xl font-semibold text-nebula-pink mb-3">
                Mars, Regulus, and the Moon
              </h3>
              <p className="text-star-dim mb-4">
                Although Mars is slowly losing ground to the approaching Sun, it's still reasonably well placed for telescopic observation in the evening sky. The planet's disc has shrunk to 5 arcseconds in diameter and dimmed to magnitude 1.3, almost matching Regulus at magnitude 1.4.
              </p>
              <div className="bg-space-blue-dark p-3 rounded-lg">
                <p className="text-sm text-stellar-gold font-medium">Key Dates:</p>
                <ul className="text-sm text-star-dim mt-2 space-y-1">
                  <li>• June 1st: Crescent Moon beside Regulus</li>
                  <li>• June 5th-27th: Mars and Regulus in same binocular field</li>
                  <li>• June 16th-17th: Closest approach (0.8 degrees apart)</li>
                </ul>
              </div>
            </div>

            {/* Planetary Highlights */}
            <div className="bg-space-blue rounded-xl shadow-xl p-6">
              <h3 className="text-xl font-semibold text-nebula-pink mb-3">
                Our Nearest Neighbors
              </h3>
              <p className="text-star-dim mb-4">
                Jupiter may be visible very low over the west-northwest horizon during the first few days of June, about 15 minutes after sunset. Mercury appears two degrees to Jupiter's right on the 7th, then climbs further from the Sun to become an easy target during the last ten days of the month.
              </p>
              <div className="bg-space-blue-dark p-3 rounded-lg">
                <p className="text-sm text-stellar-gold font-medium">Visibility:</p>
                <ul className="text-sm text-star-dim mt-2 space-y-1">
                  <li>• Jupiter: First few days, very low horizon</li>
                  <li>• Mercury: Easy target last 10 days of month</li>
                  <li>• Uranus: Lost in Sun's glare</li>
                </ul>
              </div>
            </div>

            {/* Featured Deep Sky Objects */}
            <div className="bg-space-blue rounded-xl shadow-xl p-6">
              <h3 className="text-xl font-semibold text-nebula-pink mb-3">
                Deep Sky Highlights
              </h3>
              <p className="text-star-dim mb-4">
                Summer favorites begin to take center stage. The Great Hercules Cluster (M13) is detectable in binoculars and stunning through telescopes. Galaxy season winds down with M102, the Spindle Galaxy, still visible in darker skies.
              </p>
              <div className="bg-space-blue-dark p-3 rounded-lg">
                <p className="text-sm text-stellar-gold font-medium">Must-See Objects:</p>
                <ul className="text-sm text-star-dim mt-2 space-y-1">
                  <li>• M13: Great Hercules Cluster - summer favorite</li>
                  <li>• M102: Spindle Galaxy with dark dust lane</li>
                  <li>• IC 4665: Summer Beehive cluster</li>
                  <li>• Graffias: Beautiful triple star system</li>
                </ul>
              </div>
            </div>

            {/* Observing Tips */}
            <div className="bg-space-blue rounded-xl shadow-xl p-6">
              <h3 className="text-xl font-semibold text-nebula-pink mb-3">
                Observing Tips for June
              </h3>
              <p className="text-star-dim mb-4">
                This month offers excellent opportunities for both planetary and deep-sky observation. The color contrast between Mars and Regulus provides a great photo opportunity and visual comparison.
              </p>
              <div className="bg-space-blue-dark p-3 rounded-lg">
                <p className="text-sm text-stellar-gold font-medium">Best Practices:</p>
                <ul className="text-sm text-star-dim mt-2 space-y-1">
                  <li>• Use 10x50 binoculars for Mars-Regulus pairing</li>
                  <li>• 100x magnification resolves M13 individual stars</li>
                  <li>• Dark skies needed for M102's dust lane</li>
                  <li>• Low power telescope ideal for IC 4665</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-space-blue-dark rounded-lg p-4">
            <p className="text-star-dim text-sm">
              <strong className="text-stellar-gold">Source:</strong> Content summarized from High Point Scientific's "What's in the Sky This Month? June 2025"
              <br />
              <a href="https://www.highpointscientific.com/astronomy-hub/post/night-sky-news/whats-in-the-sky-this-month-june-2025"
                 target="_blank"
                 rel="noopener noreferrer"
                 className="text-nebula-pink hover:underline text-xs">
                View Original Article →
              </a>
            </p>
          </div>
        </div>
      )}

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
            onClick={handleAdminModeToggle}
          >
            {isAdmin ? "Exit Admin Mode" : "Admin Mode"}
          </Button>
        </div>

        {isAdmin && (
          <div className="bg-space-blue rounded-lg p-6 mb-8">
            <h3 className="text-xl text-nebula-pink font-semibold mb-6">Update Monthly Guide</h3>

            {/* Status Info */}
            {!guide && !isGuideLoading && (
              <div className="mb-4 p-3 bg-yellow-900/30 text-yellow-300 border border-yellow-700 rounded">
                <div className="font-medium">No Guide Found</div>
                <div className="text-sm">No monthly guide exists for {currentMonth} {currentYear}. You can still import content to create one.</div>
              </div>
            )}

            {isGuideLoading && (
              <div className="mb-4 p-3 bg-blue-900/30 text-blue-300 border border-blue-700 rounded">
                Loading monthly guide...
              </div>
            )}

            {/* Content Import Section */}
            <div className="mb-8 p-4 bg-space-blue-dark rounded-lg">
              <h4 className="text-lg text-stellar-gold font-medium mb-4">Import Content & Objects</h4>
              <p className="text-star-dim text-sm mb-4">Parse astronomy articles to extract celestial objects and update guide content</p>

              <div className="flex gap-2 mb-4">
                <Input
                  type="text"
                  placeholder="Enter article URL (e.g., High Point Scientific monthly guide)"
                  value={contentUrl}
                  onChange={(e) => setContentUrl(e.target.value)}
                  className="flex-1 bg-space-blue border-cosmic-purple"
                />
                <Button
                  onClick={handleContentImport}
                  disabled={isImporting || !contentUrl}
                  className="bg-nebula-pink hover:bg-nebula-pink/80"
                >
                  {isImporting ? "Importing..." : "Import Content"}
                </Button>
              </div>

              {importResult && (
                <div className={`p-3 rounded text-sm ${
                  importResult.success 
                    ? 'bg-green-900/30 text-green-300 border border-green-700' 
                    : 'bg-red-900/30 text-red-300 border border-red-700'
                }`}>
                  <div className="font-medium">{importResult.success ? 'Success!' : 'Error'}</div>
                  <div>{importResult.message}</div>
                  {importResult.objectsAdded > 0 && (
                    <div className="mt-1">Added {importResult.objectsAdded} new celestial objects</div>
                  )}
                </div>
              )}
            </div>

            {/* Video Management Section */}
            <div className="p-4 bg-space-blue-dark rounded-lg">
              <h4 className="text-lg text-stellar-gold font-medium mb-4">Manage Featured Videos</h4>

              {!guide && (
                <div className="mb-4 p-3 bg-orange-900/30 text-orange-300 border border-orange-700 rounded text-sm">
                  Note: Adding videos will require a monthly guide. Import content first or create one automatically.
                </div>
              )}

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

                  if (!guide) {
                    toast({
                      title: "No Monthly Guide",
                      description: "Please import content or create a monthly guide first",
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
            {guide && guide.videoUrls && guide.videoUrls.length > 0 ? (
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

      {/* Admin Passcode Verification Dialog */}
      <Dialog open={showPasscodeDialog} onOpenChange={setShowPasscodeDialog}>
        <DialogContent className="bg-space-blue border-cosmic-purple">
          <DialogHeader>
            <DialogTitle className="text-stellar-gold">
              Admin Access Required
            </DialogTitle>
            <DialogDescription className="text-star-dim">
              Enter the admin passcode to access administrative features.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4">
            <Input
              type="password"
              placeholder="Enter passcode"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setPasscodeError(""); // Clear error when typing
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handlePasscodeSubmit();
                }
              }}
              className="bg-space-blue-dark border-cosmic-purple text-star-white"
            />
            {passcodeError && (
              <p className="mt-2 text-sm text-red-400">{passcodeError}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="border-cosmic-purple text-star-dim"
              onClick={() => {
                setShowPasscodeDialog(false);
                setPasscode("");
                setPasscodeError("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-nebula-pink hover:bg-nebula-pink/80"
              onClick={handlePasscodeSubmit}
              disabled={!passcode.trim()}
            >
              Verify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MonthlyGuidePage;
