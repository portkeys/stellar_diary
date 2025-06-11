import ApodSection from "@/components/astronomy/ApodSection";
import MonthlyGuideSection from "@/components/astronomy/MonthlyGuideSection";
import ObservationList from "@/components/astronomy/ObservationList";
import { ExternalLink } from "lucide-react";
import collimationImage from "@/assets/collimation_ad8.png";

const Home = () => {
  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      {/* Hero Section */}
      <div className="py-8 lg:py-16">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-4xl lg:text-5xl text-space font-bold text-stellar-gold mb-4">
            StellarDiary
          </h1>
          <p className="text-lg mb-6 max-w-2xl">
            My personal journey exploring the cosmos with my Apertura AD8 Dobsonian telescope. 
            Follow along as I track celestial events, record observations, and share discoveries about our fascinating universe.
          </p>
        </div>
      </div>
      
      {/* Main Content Sections */}
      <ApodSection />
      <ObservationList />
      <MonthlyGuideSection />
      
      {/* Before Observe Section */}
      <section className="my-16">
        <div className="mb-6">
          <h2 className="text-2xl text-space font-bold text-stellar-gold">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
            </svg> Before Observe
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
              href="https://www.highpointscientific.com/astronomy-hub/post/how-tos/laser-collimate-your-apertura-ad8-dobsonian" 
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
    </div>
  );
};

export default Home;
