import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { celestialObjectTypes, CelestialObject } from '@shared/schema';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Create a schema for the form
const formSchema = z.object({
  selectedObjectId: z.number().optional(),
  objectName: z.string().min(2, { message: "Object name must be at least 2 characters." }),
  objectType: z.string().optional(),
  coordinates: z.string().optional(),
  description: z.string().optional(),
  isObserved: z.boolean().default(false),
  observationDate: z.string().optional(),
  observationNotes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddObservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddObservationDialog: React.FC<AddObservationDialogProps> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const [showDateField, setShowDateField] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  
  // Fetch existing celestial objects for autocomplete
  const { data: celestialObjects = [] } = useQuery<CelestialObject[]>({
    queryKey: ['/api/celestial-objects'],
    enabled: open, // Only fetch when dialog is open
  });
  
  // Get existing observations to check for duplicates
  const { data: observations = [] } = useQuery<any[]>({
    queryKey: ['/api/observations'],
    enabled: open,
  });

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      selectedObjectId: undefined,
      objectName: '',
      objectType: '',
      coordinates: '',
      description: '',
      isObserved: false,
      observationDate: '',
      observationNotes: '',
    },
  });
  
  // Filter out objects that are already in the observation list
  const availableObjects = (celestialObjects as CelestialObject[]).filter((obj: CelestialObject) => 
    !(observations as any[]).some((obs: any) => obs.objectId === obj.id)
  );
  
  // Handle object selection from search
  const handleObjectSelect = (objectId: number) => {
    const selectedObject = (celestialObjects as CelestialObject[]).find((obj: CelestialObject) => obj.id === objectId);
    if (selectedObject) {
      form.setValue('selectedObjectId', objectId);
      form.setValue('objectName', selectedObject.name);
      form.setValue('objectType', selectedObject.type);
      form.setValue('coordinates', selectedObject.coordinates || '');
      form.setValue('description', selectedObject.description || '');
      setIsCreatingNew(false);
    }
    setSearchOpen(false);
  };
  
  // Handle creating a new custom object
  const handleCreateNew = () => {
    form.setValue('selectedObjectId', undefined);
    form.setValue('objectName', '');
    form.setValue('objectType', '');
    form.setValue('coordinates', '');
    form.setValue('description', '');
    setIsCreatingNew(true);
    setSearchOpen(false);
  };
  
  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
      setIsCreatingNew(false);
      setShowDateField(false);
    }
  }, [open, form]);

  // Create mutation for adding an observation
  const addObservationMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      let objectId: number;
      
      if (values.selectedObjectId) {
        // Use existing object
        objectId = values.selectedObjectId;
      } else {
        // Create new custom celestial object
        const response = await apiRequest('POST', '/api/celestial-objects', {
          name: values.objectName,
          type: values.objectType,
          coordinates: values.coordinates || 'Not specified',
          description: values.description || `Custom observation of ${values.objectName}`,
          month: new Date().toLocaleString('default', { month: 'long' }),
          hemisphere: 'Both',
        });
        
        const celestialObject = await response.json();
        objectId = celestialObject.id;
      }

      // Create an observation for this object
      await apiRequest('POST', '/api/observations', {
        objectId,
        isObserved: values.isObserved,
        observationNotes: values.observationNotes,
        plannedDate: values.observationDate,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/observations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/celestial-objects'] });
      const objectName = form.getValues('objectName');
      toast({
        title: 'Observation added',
        description: `${objectName} has been added to your observation list.`,
      });
      onOpenChange(false);
      form.reset();
      setIsCreatingNew(false);
    },
    onError: (error) => {
      toast({
        title: 'Failed to add observation',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    // Check for duplicate if selecting existing object
    if (values.selectedObjectId) {
      const isDuplicate = (observations as any[]).some((obs: any) => obs.objectId === values.selectedObjectId);
      if (isDuplicate) {
        toast({
          title: 'Object already in list',
          description: 'This object is already in your observation list.',
          variant: 'destructive',
        });
        return;
      }
    } else {
      // When creating new object, validate object type is provided
      if (!values.objectType) {
        toast({
          title: 'Object type required',
          description: 'Please select an object type when creating a new object.',
          variant: 'destructive',
        });
        return;
      }
    }
    
    addObservationMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-space-blue border-cosmic-purple sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-stellar-gold text-space">
            Add Observation Entry
          </DialogTitle>
          <DialogDescription>
            {isCreatingNew ? (
              <span className="text-nebula-pink">
                <i className="fas fa-plus mr-1"></i>
                Creating new custom object
              </span>
            ) : (
              "Search for existing objects or create new ones."
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="objectName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-star-white">Object Name</FormLabel>
                  {isCreatingNew ? (
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Enter object name (e.g., M13, Jupiter, Leo Triplet)"
                          className="bg-space-blue-dark border-cosmic-purple pr-10"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1 h-8 w-8 p-0 text-star-dim hover:text-stellar-gold"
                          onClick={() => {
                            setIsCreatingNew(false);
                            form.setValue('objectName', '');
                          }}
                          title="Switch back to search"
                        >
                          <i className="fas fa-search text-sm"></i>
                        </Button>
                      </div>
                    </FormControl>
                  ) : (
                    <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={searchOpen}
                            className="w-full justify-between bg-space-blue-dark border-cosmic-purple hover:bg-space-blue-light"
                          >
                            {field.value || "Search existing objects or create new..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 bg-space-blue border-cosmic-purple">
                        <Command>
                          <CommandInput 
                            placeholder="Search celestial objects..." 
                            className="h-9"
                          />
                          <CommandList>
                            <CommandEmpty>
                              <div className="p-2 text-center">
                                <p className="text-star-dim mb-2">No objects found</p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleCreateNew}
                                  className="bg-nebula-pink text-space-blue-dark hover:bg-opacity-90"
                                >
                                  <i className="fas fa-plus mr-1"></i> Create new object
                                </Button>
                              </div>
                            </CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                onSelect={handleCreateNew}
                                className="cursor-pointer"
                              >
                                <i className="fas fa-plus mr-2"></i>
                                Create new object
                              </CommandItem>
                              {availableObjects.map((obj) => (
                                <CommandItem
                                  key={obj.id}
                                  onSelect={() => handleObjectSelect(obj.id)}
                                  className="cursor-pointer"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      form.getValues('selectedObjectId') === obj.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-medium">{obj.name}</span>
                                    <span className="text-xs text-star-dim">
                                      {obj.type.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {isCreatingNew && (
              <FormField
                control={form.control}
                name="objectType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-star-white">Object Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-space-blue-dark border-cosmic-purple">
                          <SelectValue placeholder="Select object type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-space-blue border-cosmic-purple">
                        {celestialObjectTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {isCreatingNew && (
              <>
                <FormField
                  control={form.control}
                  name="coordinates"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-star-white">Coordinates (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., RA: 13h 29m | Dec: +47° 11′"
                          className="bg-space-blue-dark border-cosmic-purple"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-star-white">Description (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of the celestial object"
                          className="bg-space-blue-dark border-cosmic-purple resize-none h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="isObserved"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-cosmic-purple p-4 bg-space-blue-dark">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={value => {
                        field.onChange(value);
                        setShowDateField(!!value);
                      }}
                      className="data-[state=checked]:bg-nebula-pink data-[state=checked]:border-nebula-pink"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-star-white">
                      I've already observed this object
                    </FormLabel>
                    <p className="text-sm text-star-dim">
                      Check this if you've already observed this object and want to add it to your completed observations.
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <FormField
                control={form.control}
                name="observationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-star-white">Observation Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="bg-space-blue-dark border-cosmic-purple"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-sm text-star-dim">
                      The date when you observed or plan to observe this object
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <FormField
              control={form.control}
              name="observationNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-star-white">Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any notes about your observation or viewing plans"
                      className="bg-space-blue-dark border-cosmic-purple resize-none h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="border-cosmic-purple text-star-dim"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-nebula-pink hover:bg-opacity-90"
                disabled={addObservationMutation.isPending}
              >
                {addObservationMutation.isPending ? (
                  <>Adding <i className="fas fa-spinner fa-spin ml-1"></i></>
                ) : (
                  <>Add to Observation List</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddObservationDialog;