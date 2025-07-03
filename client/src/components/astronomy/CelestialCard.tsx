import { useState } from 'react';
import { CelestialObject } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CelestialCardProps {
  celestialObject: CelestialObject;
  inObservationList?: boolean;
  onRemove?: (id: number) => void;
}

const CelestialCard = ({ 
  celestialObject, 
  inObservationList = false,
  onRemove
}: CelestialCardProps) => {
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'galaxy':
        return <i className="fas fa-galaxy text-stellar-gold mr-1"></i>;
      case 'nebula':
        return <i className="fas fa-meteor text-nebula-pink mr-1"></i>;
      case 'planet':
        return <i className="fas fa-globe text-stellar-gold mr-1"></i>;
      case 'star_cluster':
        return <i className="fas fa-star text-stellar-gold mr-1"></i>;
      case 'double_star':
        return <i className="fas fa-star-half-alt text-stellar-gold mr-1"></i>;
      case 'moon':
        return <i className="fas fa-moon text-stellar-gold mr-1"></i>;
      default:
        return <i className="fas fa-star text-stellar-gold mr-1"></i>;
    }
  };
  
  const formatType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const getTypeSpecificFallbackImage = (type: string) => {
    switch (type) {
      case 'galaxy':
        return 'https://images.unsplash.com/photo-1544207240-3e0e0c1a8f34?w=800&h=500&fit=crop&auto=format'; // Galaxy image
      case 'nebula':
        return 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&h=500&fit=crop&auto=format'; // Nebula image
      case 'planet':
        return 'https://images.unsplash.com/photo-1614314107768-6018061b5b72?w=800&h=500&fit=crop&auto=format'; // Planet image
      case 'star_cluster':
        return 'https://images.unsplash.com/photo-1593331292296-1bb2644113cb?w=800&h=500&fit=crop&auto=format'; // Star cluster image
      case 'double_star':
        return 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=800&h=500&fit=crop&auto=format'; // Double star image
      case 'moon':
        return 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=800&h=500&fit=crop&auto=format'; // Moon image
      default:
        return 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&h=500&fit=crop&auto=format'; // Generic space image
    }
  };
  
  const handleAddToObservationList = async () => {
    if (isAdding) return;
    
    setIsAdding(true);
    try {
      await apiRequest('POST', '/api/observations', {
        objectId: celestialObject.id,
        isObserved: false
      });
      
      // Invalidate observations cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/observations'] });
      
      toast({
        title: "Added to observation list",
        description: `${celestialObject.name} has been added to your observation list.`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Failed to add to observation list",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };
  
  const handleRemoveFromList = () => {
    if (onRemove) {
      onRemove(celestialObject.id);
    }
  };
  
  return (
    <div className="bg-space-blue rounded-xl shadow-xl overflow-hidden transition-transform duration-300 hover:transform hover:scale-[1.02] hover:shadow-2xl">
      <div className="relative">
        <img 
          src={celestialObject.imageUrl ? celestialObject.imageUrl : getTypeSpecificFallbackImage(celestialObject.type)}
          alt={celestialObject.name} 
          className="w-full h-48 object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            // Fall back to a type-specific image
            target.onerror = null; // Prevent infinite loop
            target.src = getTypeSpecificFallbackImage(celestialObject.type);
          }}
        />
        <div className="absolute top-2 right-2 bg-space-blue-dark bg-opacity-75 backdrop-blur-sm px-2 py-1 rounded-full text-xs">
          {getTypeIcon(celestialObject.type)} {formatType(celestialObject.type)}
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg text-space font-semibold">{celestialObject.name}</h3>
          {!inObservationList ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    className="text-star-dim hover:text-nebula-pink"
                    onClick={handleAddToObservationList}
                    disabled={isAdding}
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add to observation list</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    className="text-nebula-pink"
                    onClick={handleRemoveFromList}
                  >
                    <i className="fas fa-bookmark"></i>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Remove from observation list</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="flex items-center gap-3 mb-3 text-sm">
          <span className="bg-cosmic-purple px-2 py-1 rounded text-xs">
            <i className="fas fa-eye mr-1"></i> {celestialObject.visibilityRating}
          </span>
          <span className="text-star-dim">
            <i className="fas fa-clock mr-1"></i> {celestialObject.bestViewingTime}
          </span>
        </div>
        <p className="text-sm text-star-dim mb-4">
          {celestialObject.description}
        </p>
        <div className="flex items-center justify-between text-xs">
          <div>
            <span className="text-mono"><i className="fas fa-map-marker-alt mr-1"></i> {celestialObject.coordinates}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CelestialCard;
