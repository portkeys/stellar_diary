import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { TelescopeTip } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";

const Learn = () => {
  // Fetch telescope tips
  const { data: tips, isLoading: tipsLoading } = useQuery<TelescopeTip[]>({
    queryKey: ['/api/telescope-tips'],
  });
  
  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-8">
      {/* Hero section */}
      <div className="mb-12">
        <div className="flex flex-col md:flex-row gap-10 items-center">
          <div className="md:w-1/2">
            <h1 className="text-4xl text-space font-bold text-stellar-gold mb-4">
              Explore the Universe with My Apertura AD8
            </h1>
            <p className="text-lg text-star-white mb-4">
              Join me in learning how to get the most out of the Apertura AD8 Dobsonian telescope and discover the wonders of the night sky.
            </p>
            <p className="text-star-dim mb-6">
              These guides document my personal journey learning about telescope setup, maintenance, and observing techniques. I'm sharing what I've learned to help others with similar interests enhance their own stargazing experience.
            </p>
          </div>
          <div className="md:w-1/2">
            <div className="relative rounded-xl overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?auto=format&fit=crop&w=800&h=500" 
                alt="Person using telescope at night" 
                className="w-full h-auto rounded-xl shadow-xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-space-blue-dark to-transparent opacity-40"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content tabs */}
      <Tabs defaultValue="beginner" className="w-full">
        <TabsList className="grid grid-cols-3 gap-4 bg-space-blue-dark p-1 rounded-xl mb-8">
          <TabsTrigger value="beginner" className="data-[state=active]:bg-cosmic-purple data-[state=active]:text-star-white">
            <i className="fas fa-rocket mr-2"></i>
            Beginner's Guide
          </TabsTrigger>
          <TabsTrigger value="telescope" className="data-[state=active]:bg-cosmic-purple data-[state=active]:text-star-white">
            <i className="fas fa-telescope mr-2"></i>
            Telescope Tips
          </TabsTrigger>
          <TabsTrigger value="deep-sky" className="data-[state=active]:bg-cosmic-purple data-[state=active]:text-star-white">
            <i className="fas fa-star mr-2"></i>
            Deep Sky Objects
          </TabsTrigger>
        </TabsList>
        
        {/* Beginner's Guide Tab */}
        <TabsContent value="beginner" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-space-blue border-cosmic-purple">
              <CardHeader>
                <CardTitle className="text-space text-nebula-pink">Getting Started</CardTitle>
                <CardDescription>Essential first steps for new telescope owners</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-star-dim">
                  <li className="flex items-start">
                    <i className="fas fa-check-circle text-stellar-gold mt-1 mr-2"></i>
                    <span>Understand the parts of your Dobsonian telescope</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check-circle text-stellar-gold mt-1 mr-2"></i>
                    <span>Learn how to properly set up and balance your telescope</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check-circle text-stellar-gold mt-1 mr-2"></i>
                    <span>Practice finding bright objects like the Moon and planets</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check-circle text-stellar-gold mt-1 mr-2"></i>
                    <span>Understand basic astronomical coordinates</span>
                  </li>
                </ul>
                <Button className="mt-4 bg-cosmic-purple hover:bg-cosmic-purple-light w-full">
                  Read Complete Guide
                </Button>
              </CardContent>
            </Card>
            
            <Card className="bg-space-blue border-cosmic-purple">
              <CardHeader>
                <CardTitle className="text-space text-nebula-pink">First Night Observing</CardTitle>
                <CardDescription>What to observe on your first night</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-star-dim">
                  <li className="flex items-start">
                    <i className="fas fa-moon text-stellar-gold mt-1 mr-2"></i>
                    <span>The Moon - observe craters, mountains, and maria</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-globe text-stellar-gold mt-1 mr-2"></i>
                    <span>Planets - Jupiter's bands and moons, Saturn's rings</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-star text-stellar-gold mt-1 mr-2"></i>
                    <span>Star clusters - Pleiades (M45) or Beehive Cluster (M44)</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-meteor text-stellar-gold mt-1 mr-2"></i>
                    <span>Bright nebulae - Orion Nebula (M42) when visible</span>
                  </li>
                </ul>
                <Button className="mt-4 bg-cosmic-purple hover:bg-cosmic-purple-light w-full">
                  View First Night Guide
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="bg-gradient-to-r from-space-blue to-cosmic-purple p-6 rounded-xl shadow-lg">
            <h3 className="text-2xl text-space font-semibold text-stellar-gold mb-3">Essential Astronomy Concepts</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="bg-space-blue-dark bg-opacity-60 p-4 rounded-lg">
                <h4 className="text-lg text-space font-medium text-nebula-pink mb-2">
                  <i className="fas fa-compass mr-2"></i> Celestial Coordinates
                </h4>
                <p className="text-sm text-star-dim">
                  Learn right ascension and declination, the celestial equivalents of longitude and latitude, to find objects in the night sky.
                </p>
              </div>
              <div className="bg-space-blue-dark bg-opacity-60 p-4 rounded-lg">
                <h4 className="text-lg text-space font-medium text-nebula-pink mb-2">
                  <i className="fas fa-eye mr-2"></i> Magnification
                </h4>
                <p className="text-sm text-star-dim">
                  Understand how eyepieces affect magnification and when to use high or low power for different celestial objects.
                </p>
              </div>
              <div className="bg-space-blue-dark bg-opacity-60 p-4 rounded-lg">
                <h4 className="text-lg text-space font-medium text-nebula-pink mb-2">
                  <i className="fas fa-search mr-2"></i> Star Hopping
                </h4>
                <p className="text-sm text-star-dim">
                  Learn the technique of navigating from bright stars to fainter objects using star patterns as your guideposts.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
        
        {/* Telescope Tips Tab */}
        <TabsContent value="telescope" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tipsLoading ? (
              <>
                <Card className="bg-space-blue border-cosmic-purple">
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-32 w-full mb-4" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
                <Card className="bg-space-blue border-cosmic-purple">
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-32 w-full mb-4" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              </>
            ) : tips && tips.length > 0 ? (
              tips.map(tip => (
                <Card key={tip.id} className="bg-space-blue border-cosmic-purple">
                  <div className="w-full h-48 overflow-hidden">
                    <img 
                      src={tip.imageUrl || ''} 
                      alt={tip.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-space text-nebula-pink">{tip.title}</CardTitle>
                    <CardDescription>Category: {tip.category}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-star-dim mb-4">{tip.content}</p>
                    {tip.title.includes("Collimating") ? (
                      <Link href="/collimation-guide">
                        <Button className="bg-cosmic-purple hover:bg-cosmic-purple-light w-full">
                          Read Full Guide
                        </Button>
                      </Link>
                    ) : (
                      <Button className="bg-cosmic-purple hover:bg-cosmic-purple-light w-full">
                        Read Full Guide
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-2 text-center py-8">
                <i className="fas fa-exclamation-triangle text-4xl text-nebula-pink mb-4"></i>
                <h3 className="text-xl font-semibold mb-2">No telescope tips available</h3>
                <p className="text-star-dim mb-4">
                  We're currently working on adding more telescope tips and guides.
                </p>
              </div>
            )}
          </div>
          
          <Card className="bg-space-blue border-cosmic-purple">
            <CardHeader>
              <CardTitle className="text-space text-stellar-gold">Maintaining Your 8-inch Dobsonian</CardTitle>
              <CardDescription>Keep your telescope in optimal condition</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h4 className="text-nebula-pink font-medium">Regular Maintenance</h4>
                  <ul className="space-y-2 text-sm text-star-dim">
                    <li className="flex items-start">
                      <i className="fas fa-check-circle text-stellar-gold mt-1 mr-2"></i>
                      <span>Keep mirrors covered when not in use</span>
                    </li>
                    <li className="flex items-start">
                      <i className="fas fa-check-circle text-stellar-gold mt-1 mr-2"></i>
                      <span>Check collimation before each observing session</span>
                    </li>
                    <li className="flex items-start">
                      <i className="fas fa-check-circle text-stellar-gold mt-1 mr-2"></i>
                      <span>Keep eyepieces in a padded case</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="text-nebula-pink font-medium">Cleaning Optics</h4>
                  <ul className="space-y-2 text-sm text-star-dim">
                    <li className="flex items-start">
                      <i className="fas fa-check-circle text-stellar-gold mt-1 mr-2"></i>
                      <span>Only clean mirrors when necessary</span>
                    </li>
                    <li className="flex items-start">
                      <i className="fas fa-check-circle text-stellar-gold mt-1 mr-2"></i>
                      <span>Use proper optical cleaning solutions</span>
                    </li>
                    <li className="flex items-start">
                      <i className="fas fa-check-circle text-stellar-gold mt-1 mr-2"></i>
                      <span>Clean eyepieces gently with lens tissue</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="text-nebula-pink font-medium">Storage</h4>
                  <ul className="space-y-2 text-sm text-star-dim">
                    <li className="flex items-start">
                      <i className="fas fa-check-circle text-stellar-gold mt-1 mr-2"></i>
                      <span>Store in a dry, temperature-stable location</span>
                    </li>
                    <li className="flex items-start">
                      <i className="fas fa-check-circle text-stellar-gold mt-1 mr-2"></i>
                      <span>Use a dust cover for the optical tube</span>
                    </li>
                    <li className="flex items-start">
                      <i className="fas fa-check-circle text-stellar-gold mt-1 mr-2"></i>
                      <span>Keep base away from moisture and direct sunlight</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Deep Sky Objects Tab */}
        <TabsContent value="deep-sky" className="space-y-8">
          <div className="bg-gradient-to-br from-space-blue to-cosmic-purple rounded-xl shadow-xl overflow-hidden">
            <div className="p-6 md:p-8">
              <h3 className="text-2xl text-space font-semibold text-stellar-gold mb-3">Deep Sky Objects</h3>
              <p className="text-star-dim mb-4">
                Deep sky objects include galaxies, nebulae, and star clusters located beyond our solar system. Your 8-inch Dobsonian telescope is powerful enough to reveal many of these celestial wonders.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-space-blue-dark bg-opacity-50 rounded-lg p-4">
                  <h4 className="text-space font-medium text-nebula-pink mb-2">Galaxies</h4>
                  <p className="text-sm text-star-dim mb-3">
                    Collections of stars, gas, and dust bound together by gravity, ranging from spiral to elliptical shapes.
                  </p>
                  <div className="bg-space-blue-dark p-3 rounded-md text-sm">
                    <p className="text-stellar-gold font-medium mb-1">What You'll See:</p>
                    <p className="text-star-dim">
                      Through your 8-inch Dobsonian, most galaxies will appear as fuzzy patches of light. With good conditions, you may see structure in larger galaxies like M31 (Andromeda) and M51 (Whirlpool).
                    </p>
                  </div>
                </div>
                <div className="bg-space-blue-dark bg-opacity-50 rounded-lg p-4">
                  <h4 className="text-space font-medium text-nebula-pink mb-2">Nebulae</h4>
                  <p className="text-sm text-star-dim mb-3">
                    Clouds of gas and dust in space, often the birthplaces of stars or remnants of dying stars.
                  </p>
                  <div className="bg-space-blue-dark p-3 rounded-md text-sm">
                    <p className="text-stellar-gold font-medium mb-1">What You'll See:</p>
                    <p className="text-star-dim">
                      Bright nebulae like M42 (Orion) will show distinct shape and some detail. Planetary nebulae like M57 (Ring) and M27 (Dumbbell) will show their characteristic shapes.
                    </p>
                  </div>
                </div>
                <div className="bg-space-blue-dark bg-opacity-50 rounded-lg p-4">
                  <h4 className="text-space font-medium text-nebula-pink mb-2">Star Clusters</h4>
                  <p className="text-sm text-star-dim mb-3">
                    Groups of stars that formed from the same molecular cloud, either loose (open) or densely packed (globular).
                  </p>
                  <div className="bg-space-blue-dark p-3 rounded-md text-sm">
                    <p className="text-stellar-gold font-medium mb-1">What You'll See:</p>
                    <p className="text-star-dim">
                      Open clusters like the Pleiades will appear as beautiful groupings of stars. Globular clusters like M13 will resolve into countless pinpoints of light with a dense center.
                    </p>
                  </div>
                </div>
                <div className="bg-space-blue-dark bg-opacity-50 rounded-lg p-4">
                  <h4 className="text-space font-medium text-nebula-pink mb-2">Double Stars</h4>
                  <p className="text-sm text-star-dim mb-3">
                    Two stars that appear close to each other in the sky, either physically bound or merely along the same line of sight.
                  </p>
                  <div className="bg-space-blue-dark p-3 rounded-md text-sm">
                    <p className="text-stellar-gold font-medium mb-1">What You'll See:</p>
                    <p className="text-star-dim">
                      Your 8-inch Dobsonian can split many double stars into their component stars. Some may show beautiful color contrasts like Albireo in Cygnus (gold and blue).
                    </p>
                  </div>
                </div>
              </div>
              
              <Button className="bg-nebula-pink hover:bg-opacity-90">
                View Deep Sky Object Catalog <i className="fas fa-arrow-right ml-2"></i>
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-space-blue border-cosmic-purple">
              <CardHeader>
                <CardTitle className="text-space text-nebula-pink">Observing Techniques</CardTitle>
                <CardDescription>Get the most out of your telescope views</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-stellar-gold">Dark Adaptation</h4>
                  <p className="text-sm text-star-dim">
                    Allow your eyes at least 30 minutes to fully adapt to darkness. Use a red flashlight to preserve night vision.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-stellar-gold">Averted Vision</h4>
                  <p className="text-sm text-star-dim">
                    Look slightly to the side of faint objects to use your more sensitive peripheral vision.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-stellar-gold">Optimal Magnification</h4>
                  <p className="text-sm text-star-dim">
                    For most deep sky objects, use lower power (25mm eyepiece). For planets and double stars, use higher magnification.
                  </p>
                </div>
                <Button className="w-full bg-cosmic-purple hover:bg-cosmic-purple-light">
                  Learn Advanced Techniques
                </Button>
              </CardContent>
            </Card>
            
            <Card className="bg-space-blue border-cosmic-purple">
              <CardHeader>
                <CardTitle className="text-space text-nebula-pink">Messier Marathon Challenge</CardTitle>
                <CardDescription>Observe all 110 Messier objects in one night</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-star-dim">
                  The Messier catalog contains some of the brightest and most interesting deep sky objects visible from the Northern Hemisphere. A "Messier Marathon" is an attempt to observe all of them in a single night.
                </p>
                <div className="bg-space-blue-dark p-3 rounded-md text-sm">
                  <p className="text-stellar-gold font-medium mb-1">Best Time:</p>
                  <p className="text-star-dim">
                    March and early April provide the best opportunity for a Messier Marathon, when all objects can potentially be viewed in one night.
                  </p>
                </div>
                <Button className="w-full bg-cosmic-purple hover:bg-cosmic-purple-light">
                  Get Messier Marathon Guide
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Resources section */}
      <div className="mt-16">
        <h2 className="text-2xl text-space font-bold mb-6">
          <i className="fas fa-book text-stellar-gold mr-2"></i> Additional Resources
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-space-blue border-cosmic-purple">
            <CardHeader>
              <CardTitle className="text-space text-nebula-pink">
                <i className="fas fa-book-open mr-2"></i> Recommended Books
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-star-dim">
                <li>
                  <p className="font-medium">Turn Left at Orion</p>
                  <p className="text-xs">by Guy Consolmagno & Dan M. Davis</p>
                </li>
                <li>
                  <p className="font-medium">NightWatch: A Practical Guide to Viewing the Universe</p>
                  <p className="text-xs">by Terence Dickinson</p>
                </li>
                <li>
                  <p className="font-medium">The Backyard Astronomer's Guide</p>
                  <p className="text-xs">by Terence Dickinson & Alan Dyer</p>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="bg-space-blue border-cosmic-purple">
            <CardHeader>
              <CardTitle className="text-space text-nebula-pink">
                <i className="fas fa-globe mr-2"></i> Useful Websites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-star-dim">
                <li>
                  <p className="font-medium">Stellarium</p>
                  <p className="text-xs">Free planetarium software for your computer</p>
                </li>
                <li>
                  <p className="font-medium">Clear Sky Chart</p>
                  <p className="text-xs">Astronomical weather forecasts for observers</p>
                </li>
                <li>
                  <p className="font-medium">Astronomy Picture of the Day</p>
                  <p className="text-xs">NASA's daily astronomy image and explanation</p>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="bg-space-blue border-cosmic-purple">
            <CardHeader>
              <CardTitle className="text-space text-nebula-pink">
                <i className="fas fa-users mr-2"></i> Astronomy Communities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-star-dim">
                <li>
                  <p className="font-medium">Local Astronomy Clubs</p>
                  <p className="text-xs">Join stargazing events and meet fellow enthusiasts</p>
                </li>
                <li>
                  <p className="font-medium">Cloudy Nights Forum</p>
                  <p className="text-xs">Large online community for telescope discussions</p>
                </li>
                <li>
                  <p className="font-medium">Reddit r/Astronomy & r/Telescopes</p>
                  <p className="text-xs">Active communities sharing tips and observations</p>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Learn;
