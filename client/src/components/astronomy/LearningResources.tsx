import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const LearningResources = () => {
  // Learning resource data
  const resources = [
    {
      id: 1,
      title: "Getting Started with Your Dobsonian",
      description: "Learn the basics of setting up and using your 8-inch Dobsonian telescope.",
      icon: "fa-solid fa-telescope",
      link: "/learn",
      color: "from-stellar-gold to-orange-500",
    },
    {
      id: 2,
      title: "Understanding Celestial Coordinates",
      description: "Master the coordinate systems used to locate objects in the night sky.",
      icon: "fa-solid fa-compass",
      link: "/learn",
      color: "from-nebula-pink to-purple-600",
    },
    {
      id: 3,
      title: "Eyepiece Selection Guide",
      description: "Choose the right eyepieces for different observing conditions and targets.",
      icon: "fa-solid fa-glasses",
      link: "/learn",
      color: "from-blue-500 to-stellar-blue",
    },
  ];

  return (
    <Card className="relative mt-12 bg-space-blue-dark bg-opacity-80 backdrop-blur-sm border-stellar-blue shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl text-stellar-gold">
          <span className="mr-2">
            <i className="fas fa-graduation-cap"></i>
          </span>
          Learning Resources
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {resources.map((resource) => (
            <div 
              key={resource.id}
              className="bg-space-blue/50 border border-stellar-blue/30 rounded-md overflow-hidden hover:border-stellar-blue/60 transition-all hover:shadow-lg"
            >
              <div className={`h-2 bg-gradient-to-r ${resource.color}`}></div>
              <div className="p-5">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${resource.color} flex items-center justify-center text-white mb-3`}>
                  <i className={resource.icon}></i>
                </div>
                <h3 className="text-lg font-medium text-stellar-gold mb-2">
                  {resource.title}
                </h3>
                <p className="text-white/80 text-sm mb-4">
                  {resource.description}
                </p>
                <Link href={resource.link}>
                  <Button 
                    variant="outline" 
                    className="w-full border-stellar-blue/50 text-white hover:bg-stellar-blue/20"
                  >
                    Learn More
                    <i className="fas fa-arrow-right ml-2"></i>
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LearningResources;