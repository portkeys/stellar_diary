import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface UpdateResult {
  success: boolean;
  message: string;
  objectsAdded: number;
  guideUpdated: boolean;
}

interface ImageUpdateResult {
  success: boolean;
  message: string;
  totalProcessed?: number;
  successCount?: number;
  failureCount?: number;
  objectName?: string;
  newImageUrl?: string;
  results?: Array<{
    objectName: string;
    success: boolean;
    message: string;
    newImageUrl?: string;
  }>;
}

interface AutoPopulateSource {
  name: string;
  status: string;
  error?: string;
  video?: {
    videoId: string;
    title: string;
    videoUrl: string;
    channelTitle: string;
  };
  objects: SuggestedObject[];
}

interface SuggestedObject {
  name: string;
  type: string;
  description: string;
  constellation?: string;
  magnitude?: string;
  viewingTips?: string;
  difficulty?: string;
  sources: string[];
  existsInDb: boolean;
  dbId?: number;
}

interface AutoPopulatePreview {
  month: string;
  year: number;
  sources: AutoPopulateSource[];
  mergedObjects: SuggestedObject[];
  suggestedHeadline: string;
  suggestedDescription: string;
  videoUrls: string[];
}

interface AutoPopulateConfirmResult {
  success: boolean;
  message: string;
  guideId?: number;
  objectsAdded?: number;
  objectsLinked?: number;
}

const Admin = () => {
  const [url, setUrl] = useState("");
  const [manualContent, setManualContent] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [hemisphere, setHemisphere] = useState("Northern");
  const [headline, setHeadline] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isManualMode, setIsManualMode] = useState(false);
  const [imageUpdateResults, setImageUpdateResults] = useState<ImageUpdateResult | null>(null);

  // Auto-populate state
  const [apMonth, setApMonth] = useState("");
  const [apYear, setApYear] = useState(new Date().getFullYear().toString());
  const [apPreview, setApPreview] = useState<AutoPopulatePreview | null>(null);
  const [apSelectedObjects, setApSelectedObjects] = useState<Set<string>>(new Set());
  const [apHeadline, setApHeadline] = useState("");
  const [apDescription, setApDescription] = useState("");
  const [apHemisphere, setApHemisphere] = useState("Northern");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateFromUrlMutation = useMutation({
    mutationFn: async (data: { url: string }): Promise<UpdateResult> => {
      const response = await fetch("/api/admin/update-monthly-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: (result: UpdateResult) => {
      toast({
        title: result.success ? "Success!" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
      if (result.success) {
        setUrl("");
        queryClient.invalidateQueries({ queryKey: ['/api/monthly-guide'] });
        queryClient.invalidateQueries({ queryKey: ['/api/celestial-objects'] });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update monthly guide. Please try again.",
        variant: "destructive",
      });
    },
  });

  const manualUpdateMutation = useMutation({
    mutationFn: async (data: any): Promise<UpdateResult> => {
      const response = await fetch("/api/admin/manual-monthly-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: (result: UpdateResult) => {
      toast({
        title: result.success ? "Success!" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
      if (result.success) {
        setManualContent("");
        setHeadline("");
        setVideoUrl("");
        queryClient.invalidateQueries({ queryKey: ['/api/monthly-guide'] });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create manual guide. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateAllImagesMutation = useMutation({
    mutationFn: async (data: { forceUpdate: boolean }): Promise<ImageUpdateResult> => {
      const response = await fetch("/api/celestial-objects/update-all-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: (result: ImageUpdateResult) => {
      setImageUpdateResults(result);
      toast({
        title: result.success ? "Image Update Complete" : "Image Update Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['/api/celestial-objects'] });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update celestial object images. Please try again.",
        variant: "destructive",
      });
    },
  });

  const refreshPlaceholderMutation = useMutation({
    mutationFn: async (): Promise<{ success: boolean; message: string; updated: number; failed: number; total: number }> => {
      const response = await fetch("/api/admin/refresh-placeholder-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: result.success ? "Images Refreshed" : "Refresh Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
      if (result.success && result.updated > 0) {
        queryClient.invalidateQueries({ queryKey: ['/api/celestial-objects'] });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to refresh placeholder images.",
        variant: "destructive",
      });
    },
  });

  // Auto-populate mutations
  const autoPopulatePreviewMutation = useMutation({
    mutationFn: async (data: { month: string; year: string }): Promise<AutoPopulatePreview> => {
      const response = await apiRequest("POST", "/api/admin/auto-populate-preview", data);
      return response.json();
    },
    onSuccess: (result: AutoPopulatePreview) => {
      setApPreview(result);
      setApHeadline(result.suggestedHeadline);
      setApDescription(result.suggestedDescription);
      // Select all objects by default
      setApSelectedObjects(new Set(result.mergedObjects.map(o => o.name)));
      toast({
        title: "Preview Ready",
        description: `Found ${result.mergedObjects.length} objects from ${result.sources.filter(s => s.objects.length > 0).length} sources`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate preview. Please try again.",
        variant: "destructive",
      });
    },
  });

  const autoPopulateConfirmMutation = useMutation({
    mutationFn: async (data: any): Promise<AutoPopulateConfirmResult> => {
      const response = await apiRequest("POST", "/api/admin/auto-populate-confirm", data);
      return response.json();
    },
    onSuccess: (result: AutoPopulateConfirmResult) => {
      toast({
        title: result.success ? "Guide Created!" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
      if (result.success) {
        setApPreview(null);
        setApSelectedObjects(new Set());
        setApHeadline("");
        setApDescription("");
        queryClient.invalidateQueries({ queryKey: ['/api/monthly-guide'] });
        queryClient.invalidateQueries({ queryKey: ['/api/celestial-objects'] });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create guide. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUrlSubmit = () => {
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }
    updateFromUrlMutation.mutate({ url: url.trim() });
  };

  const handleManualSubmit = () => {
    if (!month || !headline || !manualContent) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    manualUpdateMutation.mutate({
      month,
      year: parseInt(year),
      hemisphere,
      headline,
      description: manualContent,
      videoUrls: videoUrl ? [videoUrl] : []
    });
  };

  const handleUpdateAllImages = (forceUpdate: boolean = false) => {
    setImageUpdateResults(null);
    updateAllImagesMutation.mutate({ forceUpdate });
  };

  const handleAutoPopulatePreview = () => {
    if (!apMonth) {
      toast({ title: "Error", description: "Please select a month", variant: "destructive" });
      return;
    }
    setApPreview(null);
    autoPopulatePreviewMutation.mutate({ month: apMonth, year: apYear });
  };

  const handleAutoPopulateConfirm = () => {
    if (!apPreview || apSelectedObjects.size === 0) {
      toast({ title: "Error", description: "Please select at least one object", variant: "destructive" });
      return;
    }

    const selectedObjects = apPreview.mergedObjects.filter(o => apSelectedObjects.has(o.name));

    autoPopulateConfirmMutation.mutate({
      month: apPreview.month,
      year: apPreview.year,
      hemisphere: apHemisphere,
      headline: apHeadline,
      description: apDescription,
      videoUrls: apPreview.videoUrls,
      sources: apPreview.videoUrls,
      objects: selectedObjects,
    });
  };

  const toggleObject = (name: string) => {
    setApSelectedObjects(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const toggleAllObjects = () => {
    if (!apPreview) return;
    if (apSelectedObjects.size === apPreview.mergedObjects.length) {
      setApSelectedObjects(new Set());
    } else {
      setApSelectedObjects(new Set(apPreview.mergedObjects.map(o => o.name)));
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'Turn Left at Orion': return 'bg-blue-800 text-blue-200';
      case 'High Point Scientific': return 'bg-red-800 text-red-200';
      case 'Sky & Telescope': return 'bg-green-800 text-green-200';
      default: return 'bg-gray-800 text-gray-200';
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'moderate': return 'text-yellow-400';
      case 'challenging': return 'text-red-400';
      default: return 'text-star-dim';
    }
  };

  return (
    <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stellar-gold mb-2">
          <i className="fas fa-tools mr-3"></i>
          Monthly Guide Administration
        </h1>
        <p className="text-star-dim">
          Update monthly astronomical guides and manage celestial object databases
        </p>
      </div>

      <div className="space-y-8">
        {/* Auto-Populate Monthly Guide */}
        <Card className="bg-space-blue border-cosmic-purple p-6">
          <h2 className="text-xl font-semibold text-stellar-gold mb-4">
            <i className="fas fa-magic mr-2"></i>
            Auto-Populate Monthly Guide
          </h2>
          <p className="text-star-dim text-sm mb-4">
            Automatically gather objects from Turn Left at Orion, High Point Scientific, and Sky & Telescope YouTube channels.
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-star-white mb-2">
                  Month *
                </label>
                <Select onValueChange={setApMonth} value={apMonth}>
                  <SelectTrigger className="bg-space-blue-dark border-cosmic-purple">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent className="bg-space-blue border-cosmic-purple">
                    {months.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-star-white mb-2">
                  Year *
                </label>
                <Input
                  type="number"
                  value={apYear}
                  onChange={(e) => setApYear(e.target.value)}
                  className="bg-space-blue-dark border-cosmic-purple text-star-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-star-white mb-2">
                  Hemisphere
                </label>
                <Select onValueChange={setApHemisphere} value={apHemisphere}>
                  <SelectTrigger className="bg-space-blue-dark border-cosmic-purple">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-space-blue border-cosmic-purple">
                    <SelectItem value="Northern">Northern</SelectItem>
                    <SelectItem value="Southern">Southern</SelectItem>
                    <SelectItem value="Both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleAutoPopulatePreview}
              disabled={autoPopulatePreviewMutation.isPending}
              className="bg-stellar-gold text-space-blue-dark hover:bg-opacity-90 font-semibold px-6 py-3 text-base"
            >
              {autoPopulatePreviewMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Fetching Sources...
                </>
              ) : (
                <>
                  <i className="fas fa-search mr-2"></i>
                  Auto-Populate Preview
                </>
              )}
            </Button>

            {autoPopulatePreviewMutation.isPending && (
              <div className="p-4 bg-cosmic-purple bg-opacity-30 rounded-lg">
                <div className="flex items-center text-stellar-gold">
                  <i className="fas fa-satellite-dish fa-spin mr-3"></i>
                  <div>
                    <p className="font-medium">Gathering data from 3 sources...</p>
                    <p className="text-sm text-star-dim">Turn Left at Orion + YouTube channels (if API key set)</p>
                  </div>
                </div>
              </div>
            )}

            {/* Preview Results */}
            {apPreview && (
              <div className="space-y-4 mt-4">
                {/* Source Status */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-stellar-gold">Sources</h3>
                  {apPreview.sources.map((source) => (
                    <div key={source.name} className="flex items-center justify-between bg-space-blue-dark border border-cosmic-purple rounded-lg p-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-star-white font-medium">{source.name}</span>
                          {source.status === 'fulfilled' ? (
                            <span className="text-green-400 text-xs">
                              <i className="fas fa-check-circle mr-1"></i>
                              {source.objects.length} objects
                            </span>
                          ) : (
                            <span className="text-red-400 text-xs">
                              <i className="fas fa-times-circle mr-1"></i>
                              Failed
                            </span>
                          )}
                        </div>
                        {source.video && (
                          <p className="text-star-dim text-xs mt-1 truncate">
                            <i className="fab fa-youtube mr-1 text-red-400"></i>
                            {source.video.title}
                          </p>
                        )}
                        {source.error && (
                          <p className="text-red-400 text-xs mt-1">{source.error}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* YouTube Videos */}
                {apPreview.videoUrls.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-stellar-gold mb-2">YouTube Videos</h3>
                    <div className="space-y-2">
                      {apPreview.sources.filter(s => s.video).map((source) => (
                        <div key={source.video!.videoId} className="bg-space-blue-dark border border-cosmic-purple rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <i className="fab fa-youtube text-red-400"></i>
                            <span className="text-star-white text-sm font-medium">{source.video!.title}</span>
                          </div>
                          <p className="text-star-dim text-xs mt-1">{source.video!.channelTitle} - {source.video!.videoUrl}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Headline & Description */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-stellar-gold">Guide Details</h3>
                  <div>
                    <label className="block text-sm font-medium text-star-white mb-1">Headline</label>
                    <Input
                      value={apHeadline}
                      onChange={(e) => setApHeadline(e.target.value)}
                      className="bg-space-blue-dark border-cosmic-purple text-star-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-star-white mb-1">Description</label>
                    <Textarea
                      value={apDescription}
                      onChange={(e) => setApDescription(e.target.value)}
                      rows={3}
                      className="bg-space-blue-dark border-cosmic-purple text-star-white resize-none"
                    />
                  </div>
                </div>

                {/* Object Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-stellar-gold">
                      Suggested Objects ({apSelectedObjects.size}/{apPreview.mergedObjects.length})
                    </h3>
                    <Button
                      onClick={toggleAllObjects}
                      variant="outline"
                      size="sm"
                      className="border-cosmic-purple text-star-dim hover:text-star-white"
                    >
                      {apSelectedObjects.size === apPreview.mergedObjects.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-1">
                    {apPreview.mergedObjects.map((obj) => (
                      <div
                        key={obj.name}
                        onClick={() => toggleObject(obj.name)}
                        className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${
                          apSelectedObjects.has(obj.name)
                            ? 'bg-cosmic-purple bg-opacity-30 border-cosmic-purple'
                            : 'bg-space-blue-dark border-transparent hover:border-cosmic-purple'
                        }`}
                      >
                        <div className="mt-0.5">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            apSelectedObjects.has(obj.name)
                              ? 'bg-stellar-gold border-stellar-gold'
                              : 'border-star-dim'
                          }`}>
                            {apSelectedObjects.has(obj.name) && (
                              <i className="fas fa-check text-space-blue-dark text-xs"></i>
                            )}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-star-white font-medium">{obj.name}</span>
                            <span className="text-star-dim text-xs">({obj.type})</span>
                            {obj.existsInDb && (
                              <span className="text-xs bg-green-900 text-green-300 px-1.5 py-0.5 rounded">In DB</span>
                            )}
                            {obj.difficulty && (
                              <span className={`text-xs ${getDifficultyColor(obj.difficulty)}`}>
                                {obj.difficulty}
                              </span>
                            )}
                          </div>
                          {obj.constellation && (
                            <p className="text-star-dim text-xs">{obj.constellation}{obj.magnitude ? ` | mag ${obj.magnitude}` : ''}</p>
                          )}
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {obj.sources.map(s => (
                              <span key={s} className={`text-xs px-1.5 py-0.5 rounded ${getSourceBadgeColor(s)}`}>
                                {s}
                              </span>
                            ))}
                          </div>
                          {obj.viewingTips && (
                            <p className="text-star-dim text-xs mt-1 italic">{obj.viewingTips}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confirm Button */}
                <Button
                  onClick={handleAutoPopulateConfirm}
                  disabled={autoPopulateConfirmMutation.isPending || apSelectedObjects.size === 0}
                  className="w-full bg-stellar-gold text-space-blue-dark hover:bg-opacity-90 py-3"
                >
                  {autoPopulateConfirmMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Creating Guide...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check mr-2"></i>
                      Create {apPreview.month} {apPreview.year} Guide with {apSelectedObjects.size} Objects
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Mode Toggle */}
        <Card className="bg-space-blue border-cosmic-purple p-6">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              onClick={() => setIsManualMode(false)}
              className={`${!isManualMode ? 'bg-stellar-gold text-space-blue-dark' : 'bg-cosmic-purple'}`}
            >
              <i className="fas fa-link mr-2"></i>
              URL Import
            </Button>
            <Button
              onClick={() => setIsManualMode(true)}
              className={`${isManualMode ? 'bg-stellar-gold text-space-blue-dark' : 'bg-cosmic-purple'}`}
            >
              <i className="fas fa-edit mr-2"></i>
              Manual Entry
            </Button>
          </div>
        </Card>

        {!isManualMode ? (
          /* URL Import Mode */
          <Card className="bg-space-blue border-cosmic-purple p-6">
            <h2 className="text-xl font-semibold text-stellar-gold mb-4">
              <i className="fas fa-download mr-2"></i>
              Import from URL
            </h2>
            <p className="text-star-dim text-sm mb-4">
              Paste a URL from High Point Scientific or similar astronomy sources to automatically extract celestial objects and guide content.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-star-white mb-2">
                  Source URL
                </label>
                <Input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.highpointscientific.com/astronomy-hub/post/..."
                  className="bg-space-blue-dark border-cosmic-purple text-star-white"
                />
              </div>

              <Button
                onClick={handleUrlSubmit}
                disabled={updateFromUrlMutation.isPending}
                className="bg-stellar-gold text-space-blue-dark hover:bg-opacity-90"
              >
                {updateFromUrlMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-magic mr-2"></i>
                    Import Guide
                  </>
                )}
              </Button>
            </div>

            {updateFromUrlMutation.isPending && (
              <div className="mt-4 p-4 bg-cosmic-purple bg-opacity-30 rounded-lg">
                <div className="flex items-center text-stellar-gold">
                  <i className="fas fa-cog fa-spin mr-3"></i>
                  <div>
                    <p className="font-medium">Processing URL...</p>
                    <p className="text-sm text-star-dim">Extracting celestial objects and guide content</p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        ) : (
          /* Manual Entry Mode */
          <Card className="bg-space-blue border-cosmic-purple p-6">
            <h2 className="text-xl font-semibold text-stellar-gold mb-4">
              <i className="fas fa-pencil-alt mr-2"></i>
              Manual Guide Entry
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-star-white mb-2">
                    Month *
                  </label>
                  <Select onValueChange={setMonth} value={month}>
                    <SelectTrigger className="bg-space-blue-dark border-cosmic-purple">
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent className="bg-space-blue border-cosmic-purple">
                      {months.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-star-white mb-2">
                    Year *
                  </label>
                  <Input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="bg-space-blue-dark border-cosmic-purple text-star-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-star-white mb-2">
                    Hemisphere
                  </label>
                  <Select onValueChange={setHemisphere} value={hemisphere}>
                    <SelectTrigger className="bg-space-blue-dark border-cosmic-purple">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-space-blue border-cosmic-purple">
                      <SelectItem value="Northern">Northern</SelectItem>
                      <SelectItem value="Southern">Southern</SelectItem>
                      <SelectItem value="Both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-star-white mb-2">
                  Headline *
                </label>
                <Input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g., June 2025: Summer Sky Highlights"
                  className="bg-space-blue-dark border-cosmic-purple text-star-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-star-white mb-2">
                  Guide Content *
                </label>
                <Textarea
                  value={manualContent}
                  onChange={(e) => setManualContent(e.target.value)}
                  placeholder="Enter the monthly guide content, including featured objects, viewing tips, and astronomical highlights..."
                  rows={8}
                  className="bg-space-blue-dark border-cosmic-purple text-star-white resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-star-white mb-2">
                  Video URL (Optional)
                </label>
                <Input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/embed/..."
                  className="bg-space-blue-dark border-cosmic-purple text-star-white"
                />
              </div>

              <Button
                onClick={handleManualSubmit}
                disabled={manualUpdateMutation.isPending}
                className="bg-stellar-gold text-space-blue-dark hover:bg-opacity-90"
              >
                {manualUpdateMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>
                    Create Guide
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* NASA Image Update Section */}
        <Card className="bg-space-blue border-cosmic-purple p-6">
          <h2 className="text-xl font-semibold text-stellar-gold mb-4">
            <i className="fas fa-image mr-2"></i>
            NASA Image Update
          </h2>
          <p className="text-star-dim text-sm mb-4">
            Update celestial object images with authentic NASA images from their Image and Video Library API.
          </p>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => refreshPlaceholderMutation.mutate()}
                disabled={refreshPlaceholderMutation.isPending}
                className="bg-nebula-pink hover:bg-opacity-90"
              >
                {refreshPlaceholderMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Fetching Real Images...
                  </>
                ) : (
                  <>
                    <i className="fas fa-images mr-2"></i>
                    Replace Placeholder Images
                  </>
                )}
              </Button>
              <Button
                onClick={() => handleUpdateAllImages(false)}
                disabled={updateAllImagesMutation.isPending}
                className="bg-stellar-gold text-space-blue-dark hover:bg-opacity-90"
              >
                {updateAllImagesMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Updating Images...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sync mr-2"></i>
                    Update Inaccurate Images
                  </>
                )}
              </Button>

              <Button
                onClick={() => handleUpdateAllImages(true)}
                disabled={updateAllImagesMutation.isPending}
                className="bg-cosmic-purple hover:bg-opacity-90"
              >
                {updateAllImagesMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Force Updating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-redo mr-2"></i>
                    Update All Images
                  </>
                )}
              </Button>
            </div>

            {updateAllImagesMutation.isPending && (
              <div className="mt-4 p-4 bg-cosmic-purple bg-opacity-30 rounded-lg">
                <div className="flex items-center text-stellar-gold">
                  <i className="fas fa-satellite-dish fa-spin mr-3"></i>
                  <div>
                    <p className="font-medium">Searching NASA Image Library...</p>
                    <p className="text-sm text-star-dim">Finding authentic images for celestial objects</p>
                  </div>
                </div>
              </div>
            )}

            {imageUpdateResults && (
              <div className="mt-4 p-4 bg-space-blue-dark border border-cosmic-purple rounded-lg">
                <h3 className="text-lg font-semibold text-stellar-gold mb-2">
                  Update Results
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="text-star-white">
                    <strong>Total Processed:</strong> {imageUpdateResults.totalProcessed || 0}
                  </p>
                  <p className="text-green-400">
                    <strong>Successful:</strong> {imageUpdateResults.successCount || 0}
                  </p>
                  <p className="text-red-400">
                    <strong>Failed:</strong> {imageUpdateResults.failureCount || 0}
                  </p>

                  {imageUpdateResults.results && imageUpdateResults.results.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-stellar-gold font-medium mb-2">Detailed Results:</h4>
                      <div className="max-h-60 overflow-y-auto space-y-1">
                        {imageUpdateResults.results.map((result, index) => (
                          <div key={index} className={`p-2 rounded text-xs ${
                            result.success
                              ? 'bg-green-900 bg-opacity-30 text-green-300'
                              : 'bg-red-900 bg-opacity-30 text-red-300'
                          }`}>
                            <div className="flex items-center">
                              <i className={`fas ${result.success ? 'fa-check' : 'fa-times'} mr-2`}></i>
                              <strong>{result.objectName}</strong>
                            </div>
                            <p className="ml-4 opacity-75">{result.message}</p>
                            {result.newImageUrl && (
                              <p className="ml-4 text-blue-300 text-xs truncate">
                                New: {result.newImageUrl}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Instructions */}
        <Card className="bg-cosmic-purple bg-opacity-30 border-cosmic-purple p-6">
          <h3 className="text-lg font-semibold text-stellar-gold mb-3">
            <i className="fas fa-info-circle mr-2"></i>
            Usage Instructions
          </h3>
          <div className="space-y-3 text-star-white text-sm">
            <div>
              <strong>Auto-Populate (Recommended):</strong> Select a month/year and click "Auto-Populate Preview" to gather objects from Turn Left at Orion (book data), High Point Scientific, and Sky & Telescope YouTube channels. Review and confirm to create the guide.
            </div>
            <div>
              <strong>URL Import:</strong> Paste links from High Point Scientific's monthly guides. The system will automatically extract celestial objects, viewing tips, and create database entries.
            </div>
            <div>
              <strong>Manual Entry:</strong> Create custom monthly guides with your own content. Use this for original content or when URL import isn't available.
            </div>
            <div>
              <strong>NASA Image Updates:</strong> Use "Update Inaccurate Images" to replace poor-quality or incorrect images with authentic NASA images, or "Update All Images" to force-update all celestial object images from NASA's Image Library.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
