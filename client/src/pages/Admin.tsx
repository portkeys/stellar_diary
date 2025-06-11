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

const Admin = () => {
  const [url, setUrl] = useState("");
  const [manualContent, setManualContent] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [hemisphere, setHemisphere] = useState("Northern");
  const [headline, setHeadline] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isManualMode, setIsManualMode] = useState(false);
  
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
    onError: (error) => {
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
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create manual guide. Please try again.",
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

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

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

        {/* Instructions */}
        <Card className="bg-cosmic-purple bg-opacity-30 border-cosmic-purple p-6">
          <h3 className="text-lg font-semibold text-stellar-gold mb-3">
            <i className="fas fa-info-circle mr-2"></i>
            Usage Instructions
          </h3>
          <div className="space-y-3 text-star-white text-sm">
            <div>
              <strong>URL Import:</strong> Paste links from High Point Scientific's monthly guides. The system will automatically extract celestial objects, viewing tips, and create database entries.
            </div>
            <div>
              <strong>Manual Entry:</strong> Create custom monthly guides with your own content. Use this for original content or when URL import isn't available.
            </div>
            <div>
              <strong>Automatic Processing:</strong> Both methods will update the monthly guide display and add featured objects to the celestial database with "Add to Observe" functionality.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Admin;