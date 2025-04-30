import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ApodData {
  date: string;
  explanation: string;
  hdurl?: string;
  media_type: string;
  service_version: string;
  title: string;
  url: string;
  copyright?: string;
}

const ApodSection = () => {
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [dateParam, setDateParam] = useState<string | null>(null);

  // Format the date for the API request (YYYY-MM-DD)
  const formatDateForApi = (date: Date) => {
    return format(date, "yyyy-MM-dd");
  };

  // Get APOD data
  const { data: apodData, isLoading, isError, error } = useQuery<ApodData>({
    queryKey: [dateParam ? `/api/apod?date=${dateParam}` : "/api/apod"],
    refetchOnWindowFocus: false,
  });

  // Handle date select
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setDate(date);
      setDateParam(formatDateForApi(date));
    }
  };

  // Handle date reset
  const handleResetDate = () => {
    setDate(new Date());
    setDateParam(null);
    toast({
      title: "Date Reset",
      description: "Showing today's Astronomy Picture of the Day",
    });
  };

  return (
    <Card className="relative mt-12 bg-space-blue-dark bg-opacity-80 backdrop-blur-sm border-stellar-blue shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <CardTitle className="text-2xl text-stellar-gold">
            <span className="mr-2">
              <i className="fas fa-camera-retro"></i>
            </span>
            NASA Astronomy Picture of the Day
          </CardTitle>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="border-stellar-blue text-white hover:bg-stellar-blue/20"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-space-blue-dark border-stellar-blue">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateSelect}
                  initialFocus
                  className="bg-space-blue-dark text-white"
                  classNames={{
                    day_selected: "bg-nebula-pink text-white",
                    day_today: "bg-stellar-gold/20 text-stellar-gold",
                  }}
                />
              </PopoverContent>
            </Popover>
            <Button
              variant="ghost"
              onClick={handleResetDate}
              className="text-white hover:bg-nebula-pink/20"
              title="Show today's APOD"
            >
              <i className="fas fa-rotate-left"></i>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[300px] w-full bg-stellar-blue/20" />
            <Skeleton className="h-4 w-2/3 bg-stellar-blue/20" />
            <Skeleton className="h-4 w-full bg-stellar-blue/20" />
            <Skeleton className="h-4 w-full bg-stellar-blue/20" />
          </div>
        ) : isError ? (
          <div className="p-4 bg-red-500/20 border border-red-500 rounded-md text-center">
            <p className="text-red-300 font-medium">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              Failed to load NASA APOD:
            </p>
            <p className="text-white/80">
              {(error as Error)?.message || "Please try again later."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {apodData?.media_type === "image" ? (
              <div className="relative">
                <a
                  href={apodData.hdurl || apodData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:opacity-95 transition-opacity"
                >
                  <img
                    src={apodData.url}
                    alt={apodData.title}
                    className="w-full h-auto max-h-[500px] object-cover rounded-md shadow-lg"
                  />
                </a>
                {apodData.copyright && (
                  <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs text-white/90">
                    © {apodData.copyright.trim()}
                  </div>
                )}
              </div>
            ) : apodData?.media_type === "video" ? (
              <div className="relative aspect-video">
                <iframe
                  src={apodData.url}
                  title={apodData.title}
                  className="w-full h-[400px] rounded-md shadow-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            ) : null}

            <div>
              <h3 className="text-xl font-semibold text-stellar-gold">
                {apodData?.title}
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                {apodData?.date}{" "}
                {apodData?.copyright && `• © ${apodData.copyright.trim()}`}
              </p>
              <p className="mt-3 text-white/90 leading-relaxed">
                {apodData?.explanation}
              </p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-gray-400 text-sm pt-2">
        <div className="flex justify-between items-center w-full">
          <span>
            <span className="font-medium text-white/80">Source:</span> NASA
            Astronomy Picture of the Day
          </span>
          <a
            href="https://apod.nasa.gov/apod/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-nebula-pink hover:text-nebula-pink/80"
          >
            Visit APOD Website <i className="fas fa-external-link-alt ml-1"></i>
          </a>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ApodSection;