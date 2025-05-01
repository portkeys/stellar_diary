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
  
  // Display at most 2 tips
  const displayTips = tips.slice(0, 2);
  
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
        {displayTips.map(tip => (
          <div key={tip.id} className="bg-space-blue rounded-xl shadow-xl overflow-hidden">
            <div className="relative">
              <img 
                src={tip.imageUrl || ''} 
                alt={tip.title} 
                className="w-full h-40 object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="text-lg text-space font-semibold mb-2">{tip.title}</h3>
              <p className="text-sm text-star-dim mb-3">
                {tip.content}
              </p>
              {tip.title.includes("Collimating") ? (
                <Link href="/collimation-guide">
                  <Button variant="link" className="text-stellar-gold hover:underline p-0 text-sm">
                    Read Guide <i className="fas fa-arrow-right ml-1"></i>
                  </Button>
                </Link>
              ) : (
                <Button variant="link" className="text-stellar-gold hover:underline p-0 text-sm">
                  Read Guide <i className="fas fa-arrow-right ml-1"></i>
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TelescopeTips;
