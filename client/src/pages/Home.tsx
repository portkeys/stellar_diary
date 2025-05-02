import ApodSection from "@/components/astronomy/ApodSection";
import MonthlyGuideSection from "@/components/astronomy/MonthlyGuideSection";
import ObservationList from "@/components/astronomy/ObservationList";
import TelescopeTips from "@/components/astronomy/TelescopeTips";

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
      <TelescopeTips />
    </div>
  );
};

export default Home;
