import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Observation } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import AddObservationDialog from "@/components/astronomy/AddObservationDialog";

interface EnhancedObservation extends Observation {
  celestialObject?: any;
}

const MyObservations = () => {
  const { toast } = useToast();
  const [selectedObservation, setSelectedObservation] = useState<EnhancedObservation | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [notesInput, setNotesInput] = useState("");
  const [openDateDialog, setOpenDateDialog] = useState(false);
  const [dateInput, setDateInput] = useState("");
  const [openAddDialog, setOpenAddDialog] = useState(false);

  // Fetch user's observation list
  const { data: observations, isLoading, isError } = useQuery<EnhancedObservation[]>({
    queryKey: ['/api/observations'],
  });

  // Mutation to delete an observation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/observations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/observations'] });
      toast({
        title: "Observation removed",
        description: "The object has been removed from your observation list.",
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

  // Mutation to update observation status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, isObserved }: { id: number, isObserved: boolean }) => {
      await apiRequest('PATCH', `/api/observations/${id}`, { isObserved });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/observations'] });
      toast({
        title: "Observation updated",
        description: "Your observation status has been updated.",
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

  // Mutation to update observation notes
  const updateNotesMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number, notes: string }) => {
      await apiRequest('PATCH', `/api/observations/${id}`, { observationNotes: notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/observations'] });
      setOpenDialog(false);
      toast({
        title: "Notes updated",
        description: "Your observation notes have been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update notes",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  const handleRemove = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleToggleObserved = (id: number, currentStatus: boolean) => {
    updateStatusMutation.mutate({ id, isObserved: !currentStatus });
  };

  const handleOpenNotesDialog = (observation: EnhancedObservation) => {
    setSelectedObservation(observation);
    setNotesInput(observation.observationNotes || "");
    setOpenDialog(true);
  };

  const handleSaveNotes = () => {
    if (selectedObservation) {
      updateNotesMutation.mutate({ id: selectedObservation.id, notes: notesInput });
    }
  };
  
  // Function to open the date dialog
  const handleOpenDateDialog = (observation: EnhancedObservation) => {
    setSelectedObservation(observation);
    // Format the date to YYYY-MM-DD for the date input, adjusting for PST timezone
    if (observation.plannedDate) {
      const date = new Date(observation.plannedDate);
      // Ensure we're not losing a day due to timezone conversion
      const userTimezoneDate = new Date(date.getTime() + (480 * 60000)); // Add 8 hours for PST
      const formattedDate = userTimezoneDate.toISOString().split('T')[0];
      setDateInput(formattedDate);
    } else {
      // Default to Jan 13, 2025 as requested by the user
      setDateInput("2025-01-13");
    }
    setOpenDateDialog(true);
  };

  // Mutation to update observation date
  const updateDateMutation = useMutation({
    mutationFn: async ({ id, date }: { id: number, date: string }) => {
      // When updating the observation date, also mark the observation as observed
      await apiRequest('PATCH', `/api/observations/${id}`, { 
        plannedDate: date,
        isObserved: true // Make sure to set as observed when a date is provided
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/observations'] });
      setOpenDateDialog(false);
      toast({
        title: "Observation date updated",
        description: "Your observation date has been updated and marked as observed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update date",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  const handleSaveDate = () => {
    if (selectedObservation && dateInput) {
      updateDateMutation.mutate({ id: selectedObservation.id, date: dateInput });
    }
  };

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-8">
      {/* Page header */}
      <div className="mb-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl text-space font-bold text-stellar-gold mb-2">
              My Observation Journal
            </h1>
            <p className="text-star-dim text-lg">
              Record your celestial observations and plan your future stargazing
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              className="bg-nebula-pink hover:bg-opacity-90 px-6 py-3 rounded-lg font-medium"
              onClick={() => setOpenAddDialog(true)}
            >
              <i className="fas fa-plus mr-2"></i> Add Entry
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
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
            <>
              <div className="bg-space-blue-dark p-4 rounded-lg mb-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-star-white font-medium text-lg">{observations.length} entries in your journal</span>
                    <div className="flex items-center space-x-4 text-sm text-star-dim">
                      <div className="flex items-center">
                        <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-1"></span> 
                        To Observe: {observations.filter(obs => !obs.isObserved).length}
                      </div>
                      <div className="flex items-center">
                        <span className="inline-block w-3 h-3 rounded-full bg-green-300 mr-1"></span> 
                        Observed: {observations.filter(obs => obs.isObserved).length}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* To Observe Entries Section */}
              {observations.filter(obs => !obs.isObserved).length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl text-space font-bold mb-4 flex items-center">
                    <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                    To Observe
                  </h3>
                  <div className="space-y-3">
                    {observations.filter(obs => !obs.isObserved).map(observation => (
                      <div key={observation.id} className="bg-space-blue-light rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center">
                          <img 
                            src={observation.celestialObject?.imageUrl} 
                            alt={observation.celestialObject?.name} 
                            className="w-16 h-16 rounded-md object-cover mr-4" 
                          />
                          <div>
                            <h4 className="text-space font-medium text-lg">{observation.celestialObject?.name}</h4>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-star-dim">
                              <span>
                                <i className={`fas fa-${
                                  observation.celestialObject?.type === 'galaxy' ? 'galaxy' : 
                                  observation.celestialObject?.type === 'nebula' ? 'meteor' : 
                                  observation.celestialObject?.type === 'planet' ? 'globe' : 
                                  observation.celestialObject?.type === 'star_cluster' ? 'star' :
                                  'star'
                                } mr-1`}></i> 
                                {observation.celestialObject?.type.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                              </span>
                              <span className="flex items-center">
                                <i className="fas fa-calendar mr-1"></i> 
                                Added: {observation.dateAdded ? new Date(observation.dateAdded as Date).toLocaleDateString() : 'Unknown'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 ml-auto">
                          <Button 
                            variant="ghost"
                            className="text-star-dim hover:text-green-500"
                            onClick={() => handleOpenDateDialog(observation)}
                            title="Record observation date"
                          >
                            <i className="far fa-check-circle text-xl"></i>
                          </Button>
                          <Button 
                            variant="ghost"
                            className="text-star-dim hover:text-stellar-gold"
                            onClick={() => handleOpenNotesDialog(observation)}
                            title="Add notes"
                          >
                            <i className="fas fa-edit text-xl"></i>
                          </Button>

                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Observed Entries Section */}
              {observations.filter(obs => obs.isObserved).length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl text-space font-bold mb-4 flex items-center">
                    <span className="inline-block w-3 h-3 rounded-full bg-green-300 mr-2"></span>
                    Observed Entries
                  </h3>
                  <div className="space-y-6">
                    {observations.filter(obs => obs.isObserved).map(observation => (
                      <div key={observation.id} className="bg-space-blue-light rounded-lg p-6 flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row gap-4">
                          <img 
                            src={observation.celestialObject?.imageUrl} 
                            alt={observation.celestialObject?.name} 
                            className="w-20 h-20 rounded-md object-cover" 
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h4 className="text-space font-semibold text-xl">{observation.celestialObject?.name}</h4>
                              <div className="flex items-center space-x-2">
                                <Button 
                                  variant="ghost"
                                  className="text-green-300 hover:text-green-200"
                                  onClick={() => handleToggleObserved(observation.id, observation.isObserved!)}
                                  title="Mark as not observed"
                                >
                                  <i className="fas fa-check-circle text-xl"></i>
                                </Button>
                                <Button 
                                  variant="ghost"
                                  className="text-star-dim hover:text-stellar-gold"
                                  onClick={() => handleOpenNotesDialog(observation)}
                                  title="Edit notes"
                                >
                                  <i className="fas fa-edit text-xl"></i>
                                </Button>

                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 my-1 text-sm text-star-dim">
                              <span>
                                <i className={`fas fa-${
                                  observation.celestialObject?.type === 'galaxy' ? 'galaxy' : 
                                  observation.celestialObject?.type === 'nebula' ? 'meteor' : 
                                  observation.celestialObject?.type === 'planet' ? 'globe' : 
                                  observation.celestialObject?.type === 'star_cluster' ? 'star' :
                                  'star'
                                } mr-1`}></i> 
                                {observation.celestialObject?.type.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                              </span>
                              <span className="flex items-center">
                                <i className="fas fa-calendar mr-1"></i> 
                                Observed: {observation.plannedDate ? 
                                  (() => {
                                    const date = new Date(observation.plannedDate);
                                    // Adjust for PST timezone (UTC-8)
                                    const userTimezoneDate = new Date(date.getTime() + (480 * 60000));
                                    return userTimezoneDate.toLocaleDateString();
                                  })() : 
                                  (observation.dateAdded ? new Date(observation.dateAdded as Date).toLocaleDateString() : 'Unknown')}
                                <Button
                                  variant="ghost"
                                  className="ml-1 p-1 h-auto text-star-dim hover:text-stellar-gold"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenDateDialog(observation);
                                  }}
                                  title="Edit observation date"
                                >
                                  <i className="fas fa-pencil-alt text-xs"></i>
                                </Button>
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Journal-style notes display */}
                        <div className="mt-2">
                          {observation.observationNotes ? (
                            <div className="bg-space-blue-dark rounded-lg p-4 text-star-white">
                              <h5 className="text-nebula-pink text-sm font-medium mb-2 flex items-center">
                                <i className="fas fa-sticky-note mr-2"></i> Observation Notes
                              </h5>
                              <p className="whitespace-pre-line text-sm">{observation.observationNotes}</p>
                            </div>
                          ) : (
                            <div className="border border-dashed border-cosmic-purple rounded-lg p-4 text-center cursor-pointer" 
                                 onClick={() => handleOpenNotesDialog(observation)}>
                              <p className="text-star-dim">
                                <i className="fas fa-plus-circle mr-1"></i> Add your observation notes
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </>
          ) : (
            <div className="text-center py-12">
              <img 
                src="https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=300&h=200" 
                alt="Empty space" 
                className="mx-auto h-40 object-cover rounded-lg opacity-50 mb-4" 
              />
              <h3 className="text-xl text-space font-semibold mb-2">Your observation journal is empty</h3>
              <p className="text-star-dim mb-6 max-w-md mx-auto">
                Start adding celestial entries from the monthly guide or add your own observations to build your personal stargazing journal.
              </p>
              <Link href="/monthly-guide">
                <Button className="bg-stellar-gold text-space-blue-dark hover:bg-opacity-90 px-6 py-2 rounded-lg font-medium">
                  Browse Celestial Objects
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Notes dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="bg-space-blue border-cosmic-purple">
          <DialogHeader>
            <DialogTitle className="text-stellar-gold text-space">
              {selectedObservation?.celestialObject?.name} - Observation Notes
            </DialogTitle>
            <DialogDescription>
              Record your observations, viewing conditions, and impressions below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-4">
            <textarea 
              className="w-full h-40 rounded-md bg-space-blue-dark border-cosmic-purple p-3 text-star-white focus:outline-none focus:ring-2 focus:ring-nebula-pink"
              placeholder="e.g., Observed with 10mm eyepiece. Could clearly see the spiral arms. Best viewed after 10pm when it was high in the sky."
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
            />
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              className="border-cosmic-purple text-star-dim"
              onClick={() => setOpenDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-nebula-pink hover:bg-opacity-90"
              onClick={handleSaveNotes}
              disabled={updateNotesMutation.isPending}
            >
              {updateNotesMutation.isPending ? (
                <>Saving <i className="fas fa-spinner fa-spin ml-1"></i></>
              ) : (
                <>Save Notes</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Custom Observation Dialog */}
      <AddObservationDialog open={openAddDialog} onOpenChange={setOpenAddDialog} />

      {/* Date edit dialog */}
      <Dialog open={openDateDialog} onOpenChange={setOpenDateDialog}>
        <DialogContent className="bg-space-blue border-cosmic-purple">
          <DialogHeader>
            <DialogTitle className="text-stellar-gold text-space">
              {selectedObservation?.celestialObject?.name} - Edit Observation Date
            </DialogTitle>
            <DialogDescription>
              Update the date when you observed this object.
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-4">
            <label htmlFor="observation-date" className="block text-star-white mb-2">Observation Date:</label>
            <input 
              id="observation-date"
              type="date"
              className="w-full rounded-md bg-space-blue-dark border-cosmic-purple p-3 text-star-white focus:outline-none focus:ring-2 focus:ring-nebula-pink"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
            />
            <p className="mt-2 text-sm text-star-dim">Select the date when you actually observed this object.</p>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              className="border-cosmic-purple text-star-dim"
              onClick={() => setOpenDateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-nebula-pink hover:bg-opacity-90"
              onClick={handleSaveDate}
              disabled={updateDateMutation.isPending}
            >
              {updateDateMutation.isPending ? (
                <>Saving <i className="fas fa-spinner fa-spin ml-1"></i></>
              ) : (
                <>Update Date</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tips section */}
      <div className="mt-12">
        <h2 className="text-2xl text-space font-bold mb-6">
          <i className="fas fa-lightbulb text-stellar-gold mr-2"></i> Observation Tips
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-space-blue p-5 rounded-xl shadow-lg">
            <div className="text-nebula-pink text-xl mb-3"><i className="fas fa-book"></i></div>
            <h3 className="text-space font-semibold text-lg mb-2">Keep an Observation Journal</h3>
            <p className="text-star-dim text-sm">
              Record details like date, time, seeing conditions, and what eyepieces you used. This helps track your progress and compare observations over time.
            </p>
          </div>
          
          <div className="bg-space-blue p-5 rounded-xl shadow-lg">
            <div className="text-nebula-pink text-xl mb-3"><i className="fas fa-moon"></i></div>
            <h3 className="text-space font-semibold text-lg mb-2">Check Moon Phases</h3>
            <p className="text-star-dim text-sm">
              Plan your deep sky object observations during the new moon phase when the sky is darkest. Planets and the moon itself can be observed anytime.
            </p>
          </div>
          
          <div className="bg-space-blue p-5 rounded-xl shadow-lg">
            <div className="text-nebula-pink text-xl mb-3"><i className="fas fa-eye"></i></div>
            <h3 className="text-space font-semibold text-lg mb-2">Use Averted Vision</h3>
            <p className="text-star-dim text-sm">
              For faint objects, try looking slightly to the side instead of directly at them. This technique uses the more sensitive peripheral vision rods in your eyes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyObservations;
