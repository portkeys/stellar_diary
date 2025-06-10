import { useQuery, useMutation } from "@tanstack/react-query";
import { Observation } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EnhancedObservation extends Observation {
  celestialObject?: any; // Using any since it's dynamically added by the server
}

const ObservationList = () => {
  const { toast } = useToast();
  
  const { data: observations, isLoading, isError } = useQuery<EnhancedObservation[]>({
    queryKey: ['/api/observations'],
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/observations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/observations'] });
      toast({
        title: "Observation removed",
        description: "The object has been removed from your observation list.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove observation",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
  
  const markAsObservedMutation = useMutation({
    mutationFn: async ({ id, isObserved }: { id: number, isObserved: boolean }) => {
      await apiRequest('PATCH', `/api/observations/${id}`, { isObserved });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/observations'] });
      toast({
        title: "Observation updated",
        description: "Your observation status has been updated.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update observation",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
  
  const handleRemove = (id: number) => {
    deleteMutation.mutate(id);
  };
  
  const handleToggleObserved = (id: number, currentStatus: boolean) => {
    markAsObservedMutation.mutate({ id, isObserved: !currentStatus });
  };
  
  return (
    <section className="my-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl text-space font-bold">
          <i className="fas fa-list-check text-stellar-gold mr-2"></i> My Observation Journal
        </h2>
        <Link href="/my-observations">
          <Button className="bg-nebula-pink hover:bg-opacity-90 px-4 py-2 rounded-md text-sm font-medium">
            <i className="fas fa-plus mr-1"></i> Add Entry
          </Button>
        </Link>
      </div>
      
      <div className="bg-space-blue rounded-xl shadow-xl overflow-hidden">
        <div className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-6 w-40" />
                <div className="flex space-x-3">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
              {[1, 2, 3].map((_, index) => (
                <div key={index} className="bg-space-blue-light rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <Skeleton className="w-12 h-12 rounded-md mr-3" />
                    <div>
                      <Skeleton className="h-5 w-40 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-8">
              <i className="fas fa-exclamation-triangle text-4xl text-nebula-pink mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">Error loading your observation list</h3>
              <p className="text-star-dim mb-4">
                We encountered a problem while loading your observation list. Please try again later.
              </p>
              <Button 
                variant="default" 
                className="bg-cosmic-purple hover:bg-cosmic-purple-light"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/observations'] })}
              >
                <i className="fas fa-sync-alt mr-2"></i> Retry
              </Button>
            </div>
          ) : observations && observations.length > 0 ? (
            <div>
              <div className="mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-star-white font-medium">{observations.length} objects in your journal</span>
                  <div className="flex items-center text-xs text-green-500">
                    <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1"></span> 
                    Observed: {observations.filter(obs => obs.isObserved).length}
                  </div>
                  <div className="flex items-center text-xs text-amber-500">
                    <span className="inline-block w-3 h-3 rounded-full bg-amber-500 mr-1"></span> 
                    Planned: {observations.filter(obs => !obs.isObserved).length}
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                {observations.slice(0, 3).map(observation => (
                  <div key={observation.id} className="bg-space-blue-light rounded-lg p-3 flex items-center justify-between">
                    <div className="flex flex-col w-full">
                      <div className="flex items-center">
                        <img 
                          src={observation.celestialObject?.imageUrl} 
                          alt={observation.celestialObject?.name} 
                          className="w-12 h-12 rounded-md object-cover mr-3" 
                        />
                        <div>
                          <h4 className="text-space font-medium">{observation.celestialObject?.name}</h4>
                          <div className="flex flex-wrap items-center text-xs text-star-dim">
                            <span className="mr-3">
                              <i className={`fas fa-${
                                observation.celestialObject?.type === 'galaxy' ? 'galaxy' : 
                                observation.celestialObject?.type === 'nebula' ? 'meteor' : 
                                observation.celestialObject?.type === 'planet' ? 'globe' : 
                                'star'
                              } mr-1`}></i> 
                              {observation.celestialObject?.type.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                            </span>
                            <span className={`mr-3 ${observation.isObserved ? 'text-green-500' : 'text-amber-500'}`}>
                              <i className={`${observation.isObserved ? 'fas fa-check-circle' : 'fas fa-hourglass'} mr-1`}></i> 
                              {observation.isObserved ? 'Observed: ' : 'Planned: '}
                              {observation.plannedDate ? 
                                (() => {
                                  const date = new Date(observation.plannedDate);
                                  // Adjust for PST timezone (UTC-8)
                                  const userTimezoneDate = new Date(date.getTime() + (480 * 60000));
                                  return userTimezoneDate.toLocaleDateString();
                                })() : 
                                (observation.dateAdded ? new Date(observation.dateAdded as Date).toLocaleDateString() : 'Not set')}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Journal-style notes preview */}
                      {observation.observationNotes && (
                        <div className="mt-2 ml-15 bg-space-blue-dark p-2 rounded text-sm text-star-white">
                          <p className="flex items-start">
                            <span className="text-nebula-pink mr-2 mt-1"><i className="fas fa-sticky-note"></i></span>
                            <span className="flex-1">
                              {observation.observationNotes.length > 120 ? 
                                `${observation.observationNotes.substring(0, 120)}...` : 
                                observation.observationNotes}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        className={`${observation.isObserved ? 'text-green-500 hover:text-green-400' : 'text-star-dim hover:text-green-500'}`}
                        onClick={() => handleToggleObserved(observation.id, observation.isObserved!)}
                        title={observation.isObserved ? "Mark as not observed" : "Mark as observed"}
                      >
                        <i className={`${observation.isObserved ? 'fas' : 'far'} fa-check-circle text-xl`}></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {observations.length > 3 && (
                <div className="mt-5 text-center">
                  <Link href="/my-observations">
                    <Button className="bg-stellar-gold text-space-blue-dark hover:bg-opacity-90 px-4 py-2 rounded-lg">
                      View All Entries <i className="fas fa-arrow-right ml-1"></i>
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <img 
                src="https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=300&h=200" 
                alt="Empty space" 
                className="mx-auto h-40 object-cover rounded-lg opacity-50 mb-4" 
              />
              <h3 className="text-xl text-space font-semibold mb-2">Your observation list is empty</h3>
              <p className="text-star-dim mb-4 max-w-md mx-auto">
                Start adding celestial objects from the monthly guide or search for specific targets to build your personal observation plan.
              </p>
              <Link href="/monthly-guide">
                <Button className="bg-stellar-gold text-space-blue-dark hover:bg-opacity-90 px-6 py-2 rounded-lg font-medium">
                  Browse Recommendations
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ObservationList;
