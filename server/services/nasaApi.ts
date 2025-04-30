import { ApodResponse } from "@shared/schema";

const NASA_API_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';

/**
 * Fetches the Astronomy Picture of the Day from NASA's API
 * @param date Optional date in YYYY-MM-DD format. If not specified, returns today's APOD
 * @returns Promise with APOD data
 */
export async function fetchApod(date?: string): Promise<ApodResponse> {
  const url = new URL('https://api.nasa.gov/planetary/apod');
  
  // Add API key
  url.searchParams.append('api_key', NASA_API_KEY);
  
  // Add date parameter if provided, or use today's date explicitly
  if (date) {
    url.searchParams.append('date', date);
  } else {
    // Force today's date (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    url.searchParams.append('date', today);
  }
  
  // Add cache-busting parameter
  url.searchParams.append('_t', Date.now().toString());
  
  console.log(`Fetching NASA APOD with URL: ${url.toString()}`);
  
  const response = await fetch(url.toString(), {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
  
  if (!response.ok) {
    throw new Error(`NASA API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json() as ApodResponse;
  console.log(`NASA APOD response for date: ${data.date}`);
  return data;
}

/**
 * Fetches the Astronomy Pictures of the Day for a range of dates
 * @param startDate Start date in YYYY-MM-DD format
 * @param endDate End date in YYYY-MM-DD format
 * @returns Promise with array of APOD data
 */
export async function fetchApodRange(startDate: string, endDate: string): Promise<ApodResponse[]> {
  const url = new URL('https://api.nasa.gov/planetary/apod');
  
  // Add API key and date range parameters
  url.searchParams.append('api_key', NASA_API_KEY);
  url.searchParams.append('start_date', startDate);
  url.searchParams.append('end_date', endDate);
  
  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`NASA API error: ${response.status} ${response.statusText}`);
  }
  
  return await response.json() as ApodResponse[];
}
