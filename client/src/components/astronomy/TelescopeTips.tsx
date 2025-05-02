import { useQuery } from "@tanstack/react-query";
import { TelescopeTip } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ExternalLink } from "lucide-react";

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
          <i className="fas fa-wrench text-stellar-gold mr-2"></i> Before Observe
        </h2>
      </div>
      <div className="flex flex-col items-center">
        <div className="bg-space-blue rounded-xl shadow-xl overflow-hidden max-w-md w-full mb-4">
          <div className="relative">
            <img 
              src="https://sdmntprwestus.oaiusercontent.com/files/00000000-4228-6230-8b55-3e7066606f9c/raw?se=2025-05-02T07%3A44%3A11Z&sp=r&sv=2024-08-04&sr=b&scid=ed4de6a6-cc7b-53a3-a2f7-224e33147661&skoid=fa7966e7-f8ea-483c-919a-13acfd61d696&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-05-01T09%3A09%3A50Z&ske=2025-05-02T09%3A09%3A50Z&sks=b&skv=2024-08-04&sig=cPj4hYLEqhIkY4/CuQ1ElTlG8x9mj41TyY0v2fbnXxc%3D" 
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
