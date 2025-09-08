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

  const getTypeSpecificFallbackImage = (type: string) => {
    switch (type) {
      case 'galaxy':
        return 'https://images.unsplash.com/photo-1544207240-3e0e0c1a8f34?w=800&h=500&fit=crop&auto=format';
      case 'nebula':
        return 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&h=500&fit=crop&auto=format';
      case 'planet':
        return 'https://images.unsplash.com/photo-1614314107768-6018061b5b72?w=800&h=500&fit=crop&auto=format';
      case 'star_cluster':
        return 'https://images.unsplash.com/photo-1593331292296-1bb2644113cb?w=800&h=500&fit=crop&auto=format';
      case 'double_star':
        return 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=800&h=500&fit=crop&auto=format';
      case 'moon':
        return 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=800&h=500&fit=crop&auto=format';
      default:
        return 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&h=500&fit=crop&auto=format';
    }
  };
  
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
  
  // Sort observed entries by newest first (plannedDate fallback to dateAdded)
  const getObservationSortTime = (obs: EnhancedObservation) => {
    const dateStr = (obs.plannedDate as unknown as string) || (obs.dateAdded as unknown as string);
    return dateStr ? new Date(dateStr).getTime() : 0;
  };
  const observedSorted = (observations || [])
    .filter(obs => obs.isObserved)
    .sort((a, b) => getObservationSortTime(b) - getObservationSortTime(a));
  
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
                  <div className="flex items-center text-xs text-blue-400">
                    <span className="inline-block w-3 h-3 rounded-full bg-blue-400 mr-1"></span> 
                    To Observe: {observations.filter(obs => !obs.isObserved).length}
                  </div>
                  <div className="flex items-center text-xs text-gray-400">
                    <span className="inline-block w-3 h-3 rounded-full bg-gray-400 mr-1"></span> 
                    Observed: {observations.filter(obs => obs.isObserved).length}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - To Observe (Blue) */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-blue-400 mb-3 flex items-center">
                    <i className="fas fa-hourglass mr-2"></i>
                    To Observe
                  </h3>
                  {observations.filter(obs => !obs.isObserved).slice(0, 3).map(observation => (
                    <div key={observation.id} className="bg-blue-900 bg-opacity-30 border border-blue-400 border-opacity-30 rounded-lg p-3">
                      <div className="flex flex-col w-full">
                        <div className="flex items-center">
                          <img 
                            src={observation.celestialObject?.imageUrl || getTypeSpecificFallbackImage(observation.celestialObject?.type || 'other')} 
                            alt={observation.celestialObject?.name} 
                            className="w-10 h-10 rounded-md object-cover mr-3" 
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = getTypeSpecificFallbackImage(observation.celestialObject?.type || 'other');
                            }}
                          />
                          <div className="flex-1">
                            <h4 className="text-blue-100 font-medium">{observation.celestialObject?.name}</h4>
                            <div className="flex flex-wrap items-center text-xs text-blue-300">
                              <span className="mr-3">
                                <i className={`fas fa-${
                                  observation.celestialObject?.type === 'galaxy' ? 'galaxy' : 
                                  observation.celestialObject?.type === 'nebula' ? 'meteor' : 
                                  observation.celestialObject?.type === 'planet' ? 'globe' : 
                                  'star'
                                } mr-1`}></i> 
                                {observation.celestialObject?.type.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                              </span>
                              <span className="text-blue-400">
                                <i className="fas fa-calendar mr-1"></i> 
                                {observation.plannedDate ? 
                                  (() => {
                                    const date = new Date(observation.plannedDate);
                                    const userTimezoneDate = new Date(date.getTime() + (480 * 60000));
                                    return userTimezoneDate.toLocaleDateString();
                                  })() : 
                                  'Planned'}
                              </span>
                            </div>
                          </div>
                          <button 
                            className="text-blue-400 hover:text-blue-300"
                            onClick={() => handleToggleObserved(observation.id, observation.isObserved!)}
                            title="Mark as observed"
                          >
                            <i className="far fa-check-circle text-lg"></i>
                          </button>
                        </div>
                        
                        {observation.observationNotes && (
                          <div className="mt-2 ml-13 bg-blue-800 bg-opacity-30 p-2 rounded text-sm text-blue-100">
                            <p className="flex items-start">
                              <span className="text-blue-400 mr-2 mt-1"><i className="fas fa-sticky-note"></i></span>
                              <span className="flex-1">
                                {observation.observationNotes.length > 80 ? 
                                  `${observation.observationNotes.substring(0, 80)}...` : 
                                  observation.observationNotes}
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {observations.filter(obs => !obs.isObserved).length === 0 && (
                    <div className="text-center py-8 text-blue-400 opacity-60">
                      <i className="fas fa-check-double text-2xl mb-2"></i>
                      <p>All objects observed!</p>
                    </div>
                  )}
                </div>

                {/* Right Column - Observed (Gray) */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-400 mb-3 flex items-center">
                    <i className="fas fa-check-circle mr-2"></i>
                    Observed
                  </h3>
                  {observedSorted.slice(0, 3).map(observation => (
                    <div key={observation.id} className="bg-gray-800 bg-opacity-30 border border-gray-500 border-opacity-30 rounded-lg p-3">
                      <div className="flex flex-col w-full">
                        <div className="flex items-center">
                          <img 
                            src={observation.celestialObject?.imageUrl || getTypeSpecificFallbackImage(observation.celestialObject?.type || 'other')} 
                            alt={observation.celestialObject?.name} 
                            className="w-10 h-10 rounded-md object-cover mr-3 opacity-80" 
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = getTypeSpecificFallbackImage(observation.celestialObject?.type || 'other');
                            }}
                          />
                          <div className="flex-1">
                            <h4 className="text-gray-200 font-medium">{observation.celestialObject?.name}</h4>
                            <div className="flex flex-wrap items-center text-xs text-gray-400">
                              <span className="mr-3">
                                <i className={`fas fa-${
                                  observation.celestialObject?.type === 'galaxy' ? 'galaxy' : 
                                  observation.celestialObject?.type === 'nebula' ? 'meteor' : 
                                  observation.celestialObject?.type === 'planet' ? 'globe' : 
                                  'star'
                                } mr-1`}></i> 
                                {observation.celestialObject?.type.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                              </span>
                              <span className="text-gray-300">
                                <i className="fas fa-check mr-1"></i> 
                                {observation.plannedDate ? 
                                  (() => {
                                    const date = new Date(observation.plannedDate);
                                    const userTimezoneDate = new Date(date.getTime() + (480 * 60000));
                                    return userTimezoneDate.toLocaleDateString();
                                  })() : 
                                  'Observed'}
                              </span>
                            </div>
                          </div>
                          <button 
                            className="text-gray-400 hover:text-gray-300"
                            onClick={() => handleToggleObserved(observation.id, observation.isObserved!)}
                            title="Mark as not observed"
                          >
                            <i className="fas fa-check-circle text-lg"></i>
                          </button>
                        </div>
                        
                        {observation.observationNotes && (
                          <div className="mt-2 ml-13 bg-gray-700 bg-opacity-30 p-2 rounded text-sm text-gray-200">
                            <p className="flex items-start">
                              <span className="text-gray-400 mr-2 mt-1"><i className="fas fa-sticky-note"></i></span>
                              <span className="flex-1">
                                {observation.observationNotes.length > 80 ? 
                                  `${observation.observationNotes.substring(0, 80)}...` : 
                                  observation.observationNotes}
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {observations.filter(obs => obs.isObserved).length === 0 && (
                    <div className="text-center py-8 text-gray-500 opacity-60">
                      <i className="fas fa-eye text-2xl mb-2"></i>
                      <p>No observations yet</p>
                    </div>
                  )}
                </div>
              </div>
              
              {observations.length > 6 && (
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
