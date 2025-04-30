import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="relative z-10 h-[80vh] flex flex-col items-center justify-center px-4 max-w-3xl mx-auto text-center">
      <h1 className="text-5xl md:text-6xl font-bold text-stellar-gold mb-6">
        <span className="block">404</span>
        <span className="block mt-2">Lost in Space</span>
      </h1>
      
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-nebula-pink/10 to-stellar-gold/10 blur-2xl"></div>
        <img 
          src="https://images.unsplash.com/photo-1614642264762-d0a3b8bf3700?auto=format&fit=crop&w=600&h=400" 
          alt="Deep space nebula" 
          className="relative rounded-lg shadow-2xl w-full max-w-md"
        />
      </div>
      
      <p className="text-xl text-white/80 mb-8 max-w-lg">
        The celestial coordinates you're looking for couldn't be found. This object may have drifted out of our telescope's view.
      </p>
      
      <div className="flex flex-wrap gap-4 justify-center">
        <Link href="/">
          <Button size="lg" className="bg-nebula-pink hover:bg-nebula-pink/90">
            <i className="fas fa-home mr-2"></i> Return to Home
          </Button>
        </Link>
        <Link href="/monthly-guide">
          <Button 
            size="lg" 
            variant="outline" 
            className="border-stellar-gold text-stellar-gold hover:bg-stellar-gold/20"
          >
            <i className="fas fa-star mr-2"></i> Explore Monthly Guide
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;