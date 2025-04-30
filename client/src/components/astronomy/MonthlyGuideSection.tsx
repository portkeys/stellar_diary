import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "wouter";
import { CelestialObject } from "@shared/schema";

interface MonthlyGuide {
  id: number;
  month: string;
  year: number;
  headline: string;
  content: string;
  hemisphere: string;
  featuredObjects: number[];
}

const MonthlyGuideSection = () => {
  const [hemisphere, setHemisphere] = useState("Northern");

  // Get monthly guide data
  const { data: guideData, isLoading, isError } = useQuery<MonthlyGuide>({
    queryKey: [`/api/monthly-guide?hemisphere=${hemisphere}`],
    refetchOnWindowFocus: false,
  });

  // Get featured celestial objects
  const { data: celestialObjects } = useQuery<CelestialObject[]>({
    queryKey: ["/api/celestial-objects"],
    refetchOnWindowFocus: false,
    enabled: !isLoading && !isError && !!guideData,
  });

  // Filter featured objects
  const featuredObjects = celestialObjects?.filter((obj) => 
    guideData?.featuredObjects.includes(obj.id)
  );

  // Handle hemisphere change
  const handleHemisphereChange = (value: string) => {
    setHemisphere(value);
  };

  return (
    <Card className="relative mt-12 bg-space-blue-dark bg-opacity-80 backdrop-blur-sm border-stellar-blue shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <CardTitle className="text-2xl text-stellar-gold">
            <span className="mr-2">
              <i className="fas fa-calendar-alt"></i>
            </span>
            Monthly Sky Guide
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-white text-sm">Hemisphere:</span>
            <Select value={hemisphere} onValueChange={handleHemisphereChange}>
              <SelectTrigger className="w-[130px] border-stellar-blue text-white">
                <SelectValue placeholder="Select hemisphere" />
              </SelectTrigger>
              <SelectContent className="bg-space-blue-dark border-stellar-blue">
                <SelectItem value="Northern" className="text-white">Northern</SelectItem>
                <SelectItem value="Southern" className="text-white">Southern</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-3/4 bg-stellar-blue/20" />
            <Skeleton className="h-4 w-full bg-stellar-blue/20" />
            <Skeleton className="h-4 w-full bg-stellar-blue/20" />
            <Skeleton className="h-4 w-2/3 bg-stellar-blue/20" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <Skeleton className="h-24 w-full bg-stellar-blue/20" />
              <Skeleton className="h-24 w-full bg-stellar-blue/20" />
            </div>
          </div>
        ) : isError ? (
          <div className="p-4 bg-red-500/20 border border-red-500 rounded-md text-center">
            <p className="text-red-300 font-medium">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              Failed to load monthly guide
            </p>
            <p className="text-white/80">
              Please try again later or check your connection.
            </p>
          </div>
        ) : (
          <div>
            <h3 className="text-xl font-semibold text-stellar-gold">
              {guideData?.headline}
            </h3>
            <div className="mt-4 text-white/90 leading-relaxed whitespace-pre-line">
              {guideData?.content}
            </div>

            {featuredObjects && featuredObjects.length > 0 && (
              <div className="mt-6">
                <h4 className="text-nebula-pink font-medium mb-3">
                  <i className="fas fa-star mr-2"></i>
                  Featured Objects This Month:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {featuredObjects.map((object) => (
                    <div 
                      key={object.id}
                      className="bg-space-blue/50 border border-stellar-blue/30 rounded-md p-4 hover:border-stellar-blue transition-colors"
                    >
                      <div className="flex items-start">
                        <div className="w-16 h-16 rounded-md overflow-hidden mr-3 flex-shrink-0">
                          <img 
                            src={object.imageUrl || "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=120&h=120"} 
                            alt={object.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h5 className="font-semibold text-stellar-gold">{object.name}</h5>
                          <p className="text-white/70 text-sm capitalize">
                            <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                              object.visibilityRating === 'Excellent' 
                                ? 'bg-green-500' 
                                : object.visibilityRating === 'Good' 
                                ? 'bg-yellow-500' 
                                : 'bg-blue-500'
                            }`}></span>
                            {object.type.replace('_', ' ')}
                          </p>
                          <p className="text-white/90 text-sm mt-1 line-clamp-2">{object.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-end pt-2">
        <Link href="/monthly-guide">
          <Button 
            variant="link" 
            className="text-nebula-pink hover:text-nebula-pink/80"
          >
            View full monthly guide 
            <i className="fas fa-arrow-right ml-2"></i>
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default MonthlyGuideSection;