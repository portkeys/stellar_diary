import { useQuery } from "@tanstack/react-query";
import { TelescopeTip } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ExternalLink } from "lucide-react";
import collimationImage from "@assets/collimate_AD8.png";

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
      <div className="mb-6">
        <h2 className="text-2xl text-space font-bold text-stellar-gold">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg> Before Observe
        </h2>
      </div>
      <div className="flex flex-col items-center">
        <div className="bg-space-blue rounded-xl shadow-xl overflow-hidden max-w-md w-full mb-4">
          <div className="relative">
            <img 
              src={collimationImage} 
              alt="Collimation Guide" 
              className="w-full h-[600px] object-contain"
            />
          </div>
        </div>
        <div className="flex flex-col space-y-2 mt-2">
          <a 
            href="https://telescopicwatch.com/telescope-collimation-guide/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center text-stellar-gold hover:text-stellar-gold-light transition-colors"
          >
            <ExternalLink size={16} className="mr-2" /> 
            Telescope Collimation Guide
          </a>
          <a 
            href="https://www.highpointscientific.com/astronomy-hub/post/how-tos/laser-collimate-your-apertura-ad8-dobsonian?utm_source=google&utm_medium=cpc&utm_campaign=17241910206&utm_content=140330647087&utm_term=&gad_source=1&gbraid=0AAAAAD-khUYSOMpk7z4hOOGNeJ78viTD7&gclid=Cj0KCQjwt8zABhDKARIsAHXuD7bN82eiOInvMwS5TKhZYQJfL6RiQX-y9QQr2bo71VwmK-EdSPC_Gu4aAmnQEALw_wcB" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center text-stellar-gold hover:text-stellar-gold-light transition-colors"
          >
            <ExternalLink size={16} className="mr-2" /> 
            Laser Collimate Your Apertura AD8 Dobsonian
          </a>
        </div>
      </div>
    </section>
  );
};

export default TelescopeTips;
