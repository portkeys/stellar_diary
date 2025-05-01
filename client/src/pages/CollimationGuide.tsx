import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const CollimationGuide = () => {
  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-8">
      {/* Hero section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-10 items-center">
          <div className="md:w-1/2">
            <div className="flex items-center mb-2">
              <Link href="/learn">
                <a className="text-star-dim hover:text-stellar-gold mr-2">
                  <i className="fas fa-arrow-left"></i> Back to Learn
                </a>
              </Link>
            </div>
            <h1 className="text-4xl text-space font-bold text-stellar-gold mb-4">
              Collimating Your Apertura AD8 Dobsonian
            </h1>
            <p className="text-lg text-star-white mb-4">
              A step-by-step guide to properly align the mirrors on your AD8 for the sharpest possible views.
            </p>
            <p className="text-star-dim mb-6">
              Clear collimation is essential for sharp views through your Dobsonian. With the included laser collimator, you can complete this process in under 2 minutes once you've practiced a few times.
            </p>
          </div>
          <div className="md:w-1/2">
            <div className="relative rounded-xl overflow-hidden">
              <img 
                src="https://www.highpointscientific.com/media/wysiwyg/SEO_Articles/LaserCollimateAD8/Collimation_01.jpg" 
                alt="Apertura AD8 Dobsonian with laser collimator" 
                className="w-full h-auto rounded-xl shadow-xl"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="bg-space-blue-dark rounded-xl shadow-xl overflow-hidden p-6 mb-8">
        <h2 className="text-2xl text-space font-bold text-stellar-gold mb-4">
          What You'll Need
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-space-blue bg-opacity-50 p-4 rounded-lg flex items-start">
            <i className="fas fa-bullseye text-nebula-pink text-xl mt-1 mr-3"></i>
            <div>
              <h3 className="font-medium text-star-white mb-1">Laser Collimator</h3>
              <p className="text-sm text-star-dim">
                Included with your Apertura AD8 telescope
              </p>
            </div>
          </div>
          <div className="bg-space-blue bg-opacity-50 p-4 rounded-lg flex items-start">
            <i className="fas fa-screwdriver text-nebula-pink text-xl mt-1 mr-3"></i>
            <div>
              <h3 className="font-medium text-star-white mb-1">Phillips Screwdriver</h3>
              <p className="text-sm text-star-dim">
                For adjusting the secondary mirror
              </p>
            </div>
          </div>
          <div className="bg-space-blue bg-opacity-50 p-4 rounded-lg flex items-start">
            <i className="fas fa-clock text-nebula-pink text-xl mt-1 mr-3"></i>
            <div>
              <h3 className="font-medium text-star-white mb-1">5 Minutes</h3>
              <p className="text-sm text-star-dim">
                That's all it takes once you're familiar with the process
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Step 1 */}
      <div className="mb-12">
        <h2 className="text-3xl text-space font-bold text-stellar-gold mb-6">
          Step 1: Align the Secondary Mirror
        </h2>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/2">
            <p className="text-star-dim mb-4">
              Begin by removing your eyepiece if already installed from the Dobsonian. 
              Slide the laser collimator into the 1.25" eyepiece adapter and tighten it down. 
              Make sure the polished 45-degree slanted angle is downward facing towards the primary mirror.
            </p>
            <p className="text-star-dim mb-4">
              Power on your laser. You'll now need to align the secondary mirror to the primary mirror.
            </p>
            <div className="bg-space-blue bg-opacity-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-nebula-pink mb-2">Pro Tip</h3>
              <p className="text-sm text-star-dim">
                Place your telescope in a horizontal position when adjusting the secondary mirror to avoid 
                accidentally dropping your screwdriver onto the primary mirror.
              </p>
            </div>
            <p className="text-star-white">
              Using your Phillips screwdriver, make small adjustments to the secondary mirror hex screws 
              so that the laser hits the center spot on the primary mirror. You can incrementally loosen 
              one screw while tightening others to shift the laser dot to the center of the primary mirror.
            </p>
          </div>
          <div className="md:w-1/2">
            <div className="rounded-xl overflow-hidden mb-4">
              <img 
                src="https://www.highpointscientific.com/media/wysiwyg/SEO_Articles/LaserCollimateAD8/Collimation_03.jpg" 
                alt="Secondary mirror alignment" 
                className="w-full h-auto rounded-xl shadow-md"
              />
            </div>
            <div className="rounded-xl overflow-hidden">
              <img 
                src="https://www.highpointscientific.com/media/wysiwyg/SEO_Articles/LaserCollimateAD8/Collimation_07.jpg" 
                alt="Adjusting secondary mirror screws" 
                className="w-full h-auto rounded-xl shadow-md"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Step 2 */}
      <div className="mb-12">
        <h2 className="text-3xl text-space font-bold text-stellar-gold mb-6">
          Step 2: Align the Primary Mirror
        </h2>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/2">
            <div className="rounded-xl overflow-hidden mb-4">
              <img 
                src="https://www.highpointscientific.com/media/wysiwyg/SEO_Articles/LaserCollimateAD8/Collimation_04.jpg" 
                alt="Primary mirror alignment" 
                className="w-full h-auto rounded-xl shadow-md"
              />
            </div>
            <div className="rounded-xl overflow-hidden">
              <img 
                src="https://www.highpointscientific.com/media/wysiwyg/SEO_Articles/LaserCollimateAD8/Collimation_06.jpg" 
                alt="Adjusting primary mirror knobs" 
                className="w-full h-auto rounded-xl shadow-md"
              />
            </div>
          </div>
          <div className="md:w-1/2">
            <p className="text-star-dim mb-4">
              Next, you'll align the primary mirror. The goal is to align the primary mirror so that 
              the laser returns back to the laser collimator's 45-degree reflective surface.
            </p>
            <p className="text-star-dim mb-4">
              Begin by loosening the three white thumb screws that lock the mirror in place. These are 
              located on the back of the primary mirror cell. Loosen them just enough that the mirror 
              can be adjusted, but not so much that it moves freely.
            </p>
            <p className="text-star-dim mb-6">
              Now you can make adjustments by tightening or loosening the black knobs. Slowly make 
              adjustments as you watch the laser move across the 45-degree surface on the laser collimator.
            </p>
            <div className="bg-space-blue bg-opacity-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-nebula-pink mb-2">Target Achieved</h3>
              <p className="text-sm text-star-dim">
                When perfectly collimated, the laser will return directly to where it originated in the 
                laser collimator. Once you've achieved this, gently tighten the white thumb screws to 
                lock the primary mirror in place, being careful not to shift the mirror's position.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Checking Collimation */}
      <div className="bg-gradient-to-r from-cosmic-purple to-nebula-pink rounded-xl shadow-xl overflow-hidden p-6 mb-12">
        <h2 className="text-2xl text-space font-bold text-star-white mb-4">
          When to Check Collimation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-star-white">
          <div className="bg-cosmic-purple-dark bg-opacity-50 p-4 rounded-lg">
            <i className="fas fa-truck-moving text-2xl mb-3"></i>
            <h3 className="font-medium mb-2">After Transportation</h3>
            <p className="text-sm opacity-80">
              Always check collimation after moving your telescope, especially after car trips.
            </p>
          </div>
          <div className="bg-cosmic-purple-dark bg-opacity-50 p-4 rounded-lg">
            <i className="fas fa-temperature-low text-2xl mb-3"></i>
            <h3 className="font-medium mb-2">Temperature Changes</h3>
            <p className="text-sm opacity-80">
              Large temperature changes can affect collimation as materials expand and contract.
            </p>
          </div>
          <div className="bg-cosmic-purple-dark bg-opacity-50 p-4 rounded-lg">
            <i className="fas fa-calendar-check text-2xl mb-3"></i>
            <h3 className="font-medium mb-2">Regular Maintenance</h3>
            <p className="text-sm opacity-80">
              It's good practice to check collimation at the start of each observing session.
            </p>
          </div>
        </div>
      </div>
      
      {/* Troubleshooting */}
      <div className="mb-12">
        <h2 className="text-3xl text-space font-bold text-stellar-gold mb-6">
          Troubleshooting
        </h2>
        <div className="bg-space-blue rounded-xl shadow-xl overflow-hidden p-6">
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="bg-nebula-pink rounded-full w-8 h-8 flex items-center justify-center shrink-0 mt-1 mr-4">
                <span className="text-star-white font-medium">1</span>
              </div>
              <div>
                <h3 className="text-lg text-star-white font-medium mb-2">Laser Won't Stay in Place</h3>
                <p className="text-star-dim">
                  Make sure the thumbscrew on the focuser is tight enough to secure the laser collimator, 
                  but not so tight that it damages the barrel of the collimator.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-nebula-pink rounded-full w-8 h-8 flex items-center justify-center shrink-0 mt-1 mr-4">
                <span className="text-star-white font-medium">2</span>
              </div>
              <div>
                <h3 className="text-lg text-star-white font-medium mb-2">Laser Doesn't Power On</h3>
                <p className="text-star-dim">
                  Check that the batteries in your laser collimator are fresh. Most laser collimators 
                  use small button cell batteries that may need replacement over time.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-nebula-pink rounded-full w-8 h-8 flex items-center justify-center shrink-0 mt-1 mr-4">
                <span className="text-star-white font-medium">3</span>
              </div>
              <div>
                <h3 className="text-lg text-star-white font-medium mb-2">Can't Get Perfect Alignment</h3>
                <p className="text-star-dim">
                  If you can't get the laser to return exactly to its origin, your collimator itself might 
                  need calibration. A slightly imperfect collimation is usually acceptable - visual star 
                  tests can confirm if your views are sharp.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center mb-12">
        <Link href="/learn">
          <Button className="bg-nebula-pink hover:bg-opacity-90 px-6 py-4 text-lg rounded-lg">
            <i className="fas fa-arrow-left mr-2"></i> Back to Learning Resources
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default CollimationGuide;