import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { celestialObjectTypes } from '@shared/schema';

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

// Create a schema for the form
const formSchema = z.object({
  objectName: z.string().min(2, { message: "Object name must be at least 2 characters." }),
  objectType: z.string().min(1, { message: "Please select an object type." }),
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

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      objectName: '',
      objectType: '',
      coordinates: '',
      description: '',
      isObserved: false,
      observationDate: '',
      observationNotes: '',
    },
  });

  // Create mutation for adding a custom observation
  const addObservationMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // First create a custom celestial object
      const response = await apiRequest('POST', '/api/celestial-objects', {
        name: values.objectName,
        type: values.objectType,
        coordinates: values.coordinates || 'Not specified',
        description: values.description || `Custom observation of ${values.objectName}`,
        month: new Date().toLocaleString('default', { month: 'long' }),
        hemisphere: 'Both',
      });
      
      // Parse the response to get the celestial object with id
      const celestialObject = await response.json();

      // Then create an observation for this object
      await apiRequest('POST', '/api/observations', {
        objectId: celestialObject.id,
        isObserved: values.isObserved,
        observationNotes: values.observationNotes,
        plannedDate: values.isObserved ? values.observationDate : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/observations'] });
      toast({
        title: 'Observation added',
        description: 'Your custom observation has been added to your list.',
      });
      onOpenChange(false);
      form.reset();
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
    addObservationMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-space-blue border-cosmic-purple sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-stellar-gold text-space">
            Add Custom Observation
          </DialogTitle>
          <DialogDescription>
            Add your own celestial object to your observation list.
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
                  <FormControl>
                    <Input
                      placeholder="e.g., Leo Triplet, M51, Jupiter"
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
              name="objectType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-star-white">Object Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-space-blue-dark border-cosmic-purple">
                        <SelectValue placeholder="Select object type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-space-blue border-cosmic-purple">
                      {celestialObjectTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            {showDateField && (
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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