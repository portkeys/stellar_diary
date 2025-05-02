import { useQuery } from "@tanstack/react-query";
import { TelescopeTip } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const TelescopeTips = () => {
  const { data: tips, isLoading, isError } = useQuery<TelescopeTip[]>({
    queryKey: ['/api/telescope-tips'],
  });
  
  if (isLoading) {
    return (
      <section className="my-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl text-space font-bold">
            <i className="fas fa-telescope text-stellar-gold mr-2"></i> 8-inch Dobsonian Tips
          </h2>
          <Button variant="ghost" className="text-star-dim hover:text-star-white">
            View All Tips
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((_, index) => (
            <div key={index} className="bg-space-blue rounded-xl shadow-xl overflow-hidden">
              <Skeleton className="w-full h-40" />
              <div className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-16 w-full mb-3" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }
  
  if (isError || !tips || tips.length === 0) {
    return (
      <section className="my-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl text-space font-bold">
            <i className="fas fa-telescope text-stellar-gold mr-2"></i> 8-inch Dobsonian Tips
          </h2>
        </div>
        
        <div className="bg-space-blue rounded-xl shadow-xl overflow-hidden p-6 text-center">
          <div className="flex flex-col items-center">
            <i className="fas fa-exclamation-triangle text-4xl text-nebula-pink mb-4"></i>
            <h3 className="text-xl font-semibold mb-2">Unable to load telescope tips</h3>
            <p className="text-star-dim mb-4">There was an error loading the telescope tips. Please try again later.</p>
            <Button 
              variant="default" 
              className="bg-cosmic-purple hover:bg-cosmic-purple-light"
              onClick={() => window.location.reload()}
            >
              <i className="fas fa-sync-alt mr-2"></i> Retry
            </Button>
          </div>
        </div>
      </section>
    );
  }
  
  // Only display the collimation tip
  const collimationTip = tips.find(tip => tip.title.includes("Collimating"));
  
  if (!collimationTip) {
    return null; // Skip rendering if tip not found
  }
  
  return (
    <section className="my-16">
      <div className="flex justify-center">
        <div className="bg-space-blue rounded-xl shadow-xl overflow-hidden max-w-3xl w-full">
          <div className="relative">
            <img 
              src="/assets/collimate_AD8.png" 
              alt="Collimation Guide" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default TelescopeTips;
