import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Observation } from "@shared/schema";

interface ObservationWithObject extends Observation {
  celestialObject: {
    id: number;
    name: string;
    type: string;
    description: string;
    imageUrl?: string;
    visibilityRating?: string;
  };
}

const ObservationList = () => {
  const { toast } = useToast();

  // Get user observations
  const { data: observations, isLoading, isError } = useQuery<ObservationWithObject[]>({
    queryKey: ["/api/observations"],
    refetchOnWindowFocus: false,
  });

  // Toggle observation status
  const toggleObservation = useMutation({
    mutationFn: async ({ id, isObserved }: { id: number; isObserved: boolean }) => {
      await apiRequest("PATCH", `/api/observations/${id}`, {
        isObserved,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/observations"] });
      toast({
        title: "Observation updated",
        description: "Your observation list has been updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update observation status",
        variant: "destructive",
      });
    },
  });

  // Delete observation
  const deleteObservation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/observations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/observations"] });
      toast({
        title: "Observation removed",
        description: "Object has been removed from your observation list",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove observation",
        variant: "destructive",
      });
    },
  });

  // Check if the user has any observed objects
  const hasObserved = observations?.some((obs) => obs.isObserved) || false;
  
  // Count of total objects
  const totalObjects = observations?.length || 0;
  
  // Count of observed objects
  const observedCount = observations?.filter((obs) => obs.isObserved).length || 0;

  return (
    <Card className="relative mt-12 bg-space-blue-dark bg-opacity-80 backdrop-blur-sm border-stellar-blue shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <CardTitle className="text-2xl text-stellar-gold">
            <span className="mr-2">
              <i className="fas fa-list-check"></i>
            </span>
            My Observation List
          </CardTitle>
          {!isLoading && !isError && (
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-space-blue/50 text-white border-stellar-blue">
                {observedCount}/{totalObjects} Observed
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded-sm bg-stellar-blue/20" />
                <Skeleton className="h-12 flex-grow bg-stellar-blue/20" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="p-4 bg-red-500/20 border border-red-500 rounded-md text-center">
            <p className="text-red-300 font-medium">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              Failed to load your observation list
            </p>
            <p className="text-white/80">
              Please try again later or check your connection.
            </p>
          </div>
        ) : observations && observations.length > 0 ? (
          <div className="space-y-3">
            {observations.map((observation) => (
              <div 
                key={observation.id}
                className={`p-3 rounded-md border ${
                  observation.isObserved 
                    ? 'bg-green-900/20 border-green-600/40' 
                    : 'bg-space-blue/30 border-stellar-blue/30 hover:border-stellar-blue/60'
                } transition-colors`}
              >
                <div className="flex items-center">
                  <div className="mr-3">
                    <Checkbox 
                      id={`obs-${observation.id}`}
                      checked={observation.isObserved}
                      onCheckedChange={(checked) => {
                        toggleObservation.mutate({
                          id: observation.id,
                          isObserved: checked as boolean,
                        });
                      }}
                      className={`${observation.isObserved ? 'border-green-400 text-green-400' : 'border-stellar-blue text-stellar-gold'}`}
                    />
                  </div>
                  <div className="flex-grow mr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-stellar-gold">
                        {observation.celestialObject.name}
                      </span>
                      <Badge 
                        variant="outline" 
                        className="text-xs px-1 py-0 h-5 capitalize bg-nebula-pink/20 border-nebula-pink/40 text-nebula-pink/90"
                      >
                        {observation.celestialObject.type.replace('_', ' ')}
                      </Badge>
                      {observation.isObserved && (
                        <Badge className="bg-green-600/90 hover:bg-green-600 text-xs px-1.5 py-0 h-5">
                          <i className="fas fa-check text-xs mr-1"></i> Observed
                        </Badge>
                      )}
                    </div>
                    {observation.plannedDate && (
                      <p className="text-xs text-white/70 mt-1">
                        <i className="far fa-calendar-alt mr-1"></i>
                        Planned: {observation.plannedDate}
                      </p>
                    )}
                    {observation.observationNotes && (
                      <p className="text-sm text-white/80 mt-1 italic">
                        "{observation.observationNotes}"
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-gray-400 hover:text-red-400 hover:bg-red-500/20"
                    onClick={() => deleteObservation.mutate(observation.id)}
                  >
                    <i className="fas fa-times"></i>
                    <span className="sr-only">Remove</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-3">
              <i className="fas fa-telescope text-4xl"></i>
            </div>
            <h3 className="text-stellar-gold font-medium mb-1">
              Your observation list is empty
            </h3>
            <p className="text-white/70 mb-4">
              Start adding celestial objects you want to observe
            </p>
            <Link href="/monthly-guide">
              <Button className="bg-nebula-pink hover:bg-nebula-pink/90">
                Explore Objects to Observe
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
      {hasObserved && (
        <CardFooter className="pt-0">
          <div className="w-full bg-gradient-to-r from-stellar-gold/20 to-nebula-pink/20 rounded-md p-3 mt-2">
            <div className="flex items-center gap-2">
              <div className="text-yellow-400 text-lg">
                <i className="fas fa-trophy"></i>
              </div>
              <div>
                <p className="text-white font-medium">
                  Great job! You've observed {observedCount} celestial objects.
                </p>
                <p className="text-white/70 text-sm">
                  Keep exploring the night sky to earn more achievements.
                </p>
              </div>
            </div>
          </div>
        </CardFooter>
      )}
      <CardFooter className="justify-end pt-2">
        <Link href="/my-observations">
          <Button 
            variant="link" 
            className="text-nebula-pink hover:text-nebula-pink/80"
          >
            Manage all observations 
            <i className="fas fa-arrow-right ml-2"></i>
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default ObservationList;