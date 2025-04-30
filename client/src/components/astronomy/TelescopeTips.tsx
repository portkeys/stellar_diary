import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Link } from "wouter";

interface TelescopeTip {
  id: number;
  title: string;
  content: string;
  category: string;
  imageUrl?: string;
}

const TelescopeTips = () => {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Get telescope tips
  const { data: tips, isLoading, isError } = useQuery<TelescopeTip[]>({
    queryKey: [activeCategory === "all" ? "/api/telescope-tips" : `/api/telescope-tips?category=${activeCategory}`],
    refetchOnWindowFocus: false,
  });

  // Get unique categories from tips
  const categories = tips ? 
    Array.from(new Set(tips.map(tip => tip.category))) : 
    [];

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
  };

  return (
    <Card className="relative mt-12 bg-space-blue-dark bg-opacity-80 backdrop-blur-sm border-stellar-blue shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl text-stellar-gold">
          <span className="mr-2">
            <i className="fas fa-lightbulb"></i>
          </span>
          Telescope Tips
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full max-w-md mx-auto bg-stellar-blue/20" />
            <Skeleton className="h-24 w-full bg-stellar-blue/20" />
            <Skeleton className="h-24 w-full bg-stellar-blue/20" />
          </div>
        ) : isError ? (
          <div className="p-4 bg-red-500/20 border border-red-500 rounded-md text-center">
            <p className="text-red-300 font-medium">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              Failed to load telescope tips
            </p>
            <p className="text-white/80">
              Please try again later or check your connection.
            </p>
          </div>
        ) : tips && tips.length > 0 ? (
          <>
            <Tabs 
              defaultValue="all" 
              value={activeCategory}
              onValueChange={handleCategoryChange}
              className="w-full"
            >
              <TabsList className="mb-6 w-full max-w-md mx-auto bg-space-blue/60">
                <TabsTrigger 
                  value="all"
                  className="data-[state=active]:bg-nebula-pink data-[state=active]:text-white"
                >
                  All Tips
                </TabsTrigger>
                {categories.map((category) => (
                  <TabsTrigger 
                    key={category} 
                    value={category}
                    className="capitalize data-[state=active]:bg-nebula-pink data-[state=active]:text-white"
                  >
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tips.map((tip) => (
                  <div
                    key={tip.id}
                    className="bg-space-blue/50 border border-stellar-blue/30 rounded-md p-4 hover:border-stellar-blue/60 transition-colors"
                  >
                    <div className="flex">
                      {tip.imageUrl && (
                        <div className="w-16 h-16 rounded-md overflow-hidden mr-3 flex-shrink-0">
                          <img 
                            src={tip.imageUrl} 
                            alt={tip.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <h4 className="text-lg font-medium text-stellar-gold mb-1">
                          {tip.title}
                        </h4>
                        <div className="text-white/90 text-sm">{tip.content}</div>
                        <div className="mt-2">
                          <Badge className="capitalize bg-nebula-pink/20 text-nebula-pink/90 hover:bg-nebula-pink/30">
                            {tip.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Tabs>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-3">
              <i className="fas fa-file-circle-question text-4xl"></i>
            </div>
            <h3 className="text-stellar-gold font-medium mb-1">
              No tips available
            </h3>
            <p className="text-white/70">
              Check back later for helpful telescope usage tips
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-end pt-2">
        <Link href="/learn">
          <Button 
            variant="link" 
            className="text-nebula-pink hover:text-nebula-pink/80"
          >
            View all learning resources 
            <i className="fas fa-arrow-right ml-2"></i>
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

// Adding Badge component to avoid import issues
const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <span className={`inline-flex items-center px-2 py-1 rounded-sm text-xs font-medium ${className}`}>
    {children}
  </span>
);

export default TelescopeTips;