import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const LearningResources = () => {
  return (
    <section className="my-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl text-space font-bold">
          <i className="fas fa-graduation-cap text-stellar-gold mr-2"></i> Learning Resources
        </h2>
      </div>
      
      <div className="bg-gradient-to-br from-space-blue to-cosmic-purple rounded-xl shadow-xl overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-xl text-space font-semibold mb-3">Deep Sky Objects</h3>
              <p className="text-star-dim mb-4">
                Deep sky objects include galaxies, nebulae, and star clusters located beyond our solar system. Your 8-inch Dobsonian telescope is powerful enough to reveal many of these celestial wonders.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="bg-space-blue-dark bg-opacity-50 rounded-lg p-3">
                  <h4 className="text-space font-medium mb-1">Galaxies</h4>
                  <p className="text-sm text-star-dim">
                    Collections of stars, gas, and dust bound together by gravity, ranging from spiral to elliptical shapes.
                  </p>
                </div>
                <div className="bg-space-blue-dark bg-opacity-50 rounded-lg p-3">
                  <h4 className="text-space font-medium mb-1">Nebulae</h4>
                  <p className="text-sm text-star-dim">
                    Clouds of gas and dust in space, often the birthplaces of stars or remnants of dying stars.
                  </p>
                </div>
                <div className="bg-space-blue-dark bg-opacity-50 rounded-lg p-3">
                  <h4 className="text-space font-medium mb-1">Star Clusters</h4>
                  <p className="text-sm text-star-dim">
                    Groups of stars that formed from the same molecular cloud, either loose (open) or densely packed (globular).
                  </p>
                </div>
                <div className="bg-space-blue-dark bg-opacity-50 rounded-lg p-3">
                  <h4 className="text-space font-medium mb-1">Double Stars</h4>
                  <p className="text-sm text-star-dim">
                    Two stars that appear close to each other in the sky, either physically bound or merely along the same line of sight.
                  </p>
                </div>
              </div>
              
              <Link href="/my-progress">
                <Button className="bg-nebula-pink hover:bg-opacity-90 px-4 py-2 rounded-md text-sm font-medium">
                  Track Progress <i className="fas fa-arrow-right ml-1"></i>
                </Button>
              </Link>
            </div>
            
            <div className="relative h-60 md:h-auto overflow-hidden rounded-lg">
              <img 
                src="https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=400&h=600" 
                alt="Galaxy in deep space" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-space-blue-dark to-transparent opacity-60"></div>
              <div className="absolute bottom-4 left-4 right-4">
                <Button className="bg-space-blue-dark bg-opacity-75 backdrop-blur-sm w-full py-2 rounded-lg font-medium text-star-white">
                  <i className="fas fa-play-circle mr-1"></i> Watch Tutorial
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LearningResources;
