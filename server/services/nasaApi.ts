import { ApodResponse, InsertApodCache, apodCache } from "@shared/schema";
import { db } from "../db";
import { eq, desc } from "drizzle-orm";

const NASA_API_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';

/**
 * Fetches the Astronomy Picture of the Day from NASA's API with database caching
 * @param date Optional date in YYYY-MM-DD format. If not specified, returns today's APOD
 * @param forceRefresh Force a refresh from the NASA API even if we have cached data
 * @returns Promise with APOD data
 */
export async function fetchApod(date?: string, forceRefresh = false): Promise<ApodResponse> {
  // Get the current date, but make it compatible with the NASA API
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  
  // Real date format for API requests, instead of simulated future date
  const realDate = `${year}-${month}-${day}`;  
  const targetDate = date || realDate;
  
  // Check for cached data first, unless forceRefresh is true
  if (!forceRefresh) {
    try {
      const cachedData = await db.select().from(apodCache).where(eq(apodCache.date, targetDate));
      
      if (cachedData.length > 0) {
        console.log(`Using cached APOD data for ${targetDate}`);
        return cachedData[0] as unknown as ApodResponse;
      }
    } catch (err) {
      console.error('Error checking cache:', err);
      // Continue to fetch from API if cache fails
    }
  }
  
  try {
    console.log(`Fetching APOD data from NASA API...`);
    
    // Fetch actual NASA APOD data from the API
    const url = new URL('https://api.nasa.gov/planetary/apod');
    url.searchParams.append('api_key', NASA_API_KEY);
    
    // Only add date param if a specific date was requested
    if (date) {
      url.searchParams.append('date', date);
    }
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`NASA API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as ApodResponse;
    
    // Save to cache
    try {
      const insertData: InsertApodCache = {
        date: data.date,
        title: data.title,
        explanation: data.explanation,
        url: data.url,
        hdurl: data.hdurl || null,
        media_type: data.media_type,
        copyright: data.copyright || null,
        service_version: data.service_version || null
      };
      
      // Delete any existing record for the same date
      await db.delete(apodCache).where(eq(apodCache.date, data.date));
      
      // Insert new record with fresh data
      await db.insert(apodCache).values(insertData);
      console.log(`Cached new APOD data for ${data.date}`);
    } catch (err) {
      console.error('Error caching APOD data:', err);
      // Continue even if caching fails
    }
    
    return data;
  } catch (error) {
    console.error('Error handling APOD:', error);
    
    // Try to get the most recent cached entry as a fallback
    try {
      const cachedEntries = await db.select().from(apodCache).orderBy(desc(apodCache.cached_at)).limit(1);
      if (cachedEntries.length > 0) {
        console.log('Using most recent cached APOD as fallback');
        const latestEntry = cachedEntries[0];
        // Keep the original date from the cached entry for historical accuracy
        return latestEntry as unknown as ApodResponse;
      }
    } catch (err) {
      console.error('Error fetching fallback from cache:', err);
    }
    
    // Last resort fallback
    return {
      date: targetDate,
      explanation: "Sometimes, the sky itself seems to smile. A few days ago, visible over much of the world, an unusual superposition of our Moon with the planets Venus and Saturn created just such an iconic facial expression. Specifically, a crescent Moon appeared to make a happy face on the night sky when paired with seemingly nearby planets.",
      media_type: "image",
      service_version: "v1",
      title: "A Happy Sky over Bufa Hill in Mexico",
      url: "https://apod.nasa.gov/apod/image/2504/HappySkyMexico_Korona_960.jpg",
      hdurl: "https://apod.nasa.gov/apod/image/2504/HappySkyMexico_Korona_1358.jpg",
      copyright: "Daniel Korona"
    };
  }
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
