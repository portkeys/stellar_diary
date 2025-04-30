import ApodSection from "@/components/astronomy/ApodSection";
import MonthlyGuideSection from "@/components/astronomy/MonthlyGuideSection";
import ObservationList from "@/components/astronomy/ObservationList";
import TelescopeTips from "@/components/astronomy/TelescopeTips";
import LearningResources from "@/components/astronomy/LearningResources";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const Home = () => {
  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      {/* Hero Section */}
      <div className="py-8 lg:py-16">
        <div className="flex flex-col md:flex-row items-center md:items-start">
          <div className="md:w-1/2 md:pr-8">
            <h1 className="text-4xl lg:text-5xl text-space font-bold text-stellar-gold mb-4">
              Discover the Wonders of the Night Sky
            </h1>
            <p className="text-lg mb-6">
              Your personal guide to exploring the cosmos with your 8-inch Dobsonian telescope. 
              Track celestial events, build your observation list, and learn about our fascinating universe.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/monthly-guide">
                <Button className="bg-nebula-pink hover:bg-opacity-90 px-6 py-3 rounded-lg font-medium text-white shadow-lg">
                  <i className="fas fa-star mr-2"></i> Start Exploring
                </Button>
              </Link>
              <Link href="/learn">
                <Button variant="outline" className="bg-transparent border border-stellar-gold text-stellar-gold hover:bg-stellar-gold hover:bg-opacity-20 px-6 py-3 rounded-lg font-medium shadow-lg">
                  <i className="fas fa-book-open mr-2"></i> Beginner's Guide
                </Button>
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 mt-8 md:mt-0 relative">
            <img 
              src="https://images.unsplash.com/photo-1464802686167-b939a6910659?auto=format&fit=crop&w=800&h=600" 
              alt="Telescope pointing at night sky with stars" 
              className="rounded-lg shadow-2xl w-full object-cover h-[350px]"
            />
            <div className="absolute bottom-4 right-4 bg-space-blue-dark bg-opacity-75 backdrop-blur-sm px-3 py-1 rounded text-xs">
              Photo by Unsplash
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content Sections */}
      <ApodSection />
      <MonthlyGuideSection />
      <ObservationList />
      <TelescopeTips />
      <LearningResources />
    </div>
  );
};

export default Home;
