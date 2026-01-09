/**
 * NASA APOD API Integration
 *
 * Fetches Astronomy Picture of the Day from NASA's API with database caching.
 * Uses Node.js native fetch (Vercel compatible - no Python dependency).
 */

import { ApodResponse, InsertApodCache, apodCache } from "@shared/schema";
import { db } from "../db";
import { eq, desc } from "drizzle-orm";

const NASA_API_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';

/**
 * Fetch APOD from NASA's official API using Node.js fetch
 */
async function fetchApodFromNasaApi(date?: string): Promise<ApodResponse> {
  const baseUrl = 'https://api.nasa.gov/planetary/apod';
  const params = new URLSearchParams({ api_key: NASA_API_KEY });
  if (date) params.set('date', date);

  const url = `${baseUrl}?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'StellarDiary/1.0 (+https://stellar-diary.vercel.app)'
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`NASA APOD API error ${response.status}: ${text}`);
  }

  const data = await response.json();

  // Normalize to ApodResponse shape
  const normalized: ApodResponse = {
    date: data.date,
    title: data.title,
    explanation: data.explanation,
    url: data.url,
    hdurl: data.hdurl,
    media_type: data.media_type,
    service_version: data.service_version || 'v1',
    copyright: data.copyright
  };

  return normalized;
}

/**
 * Fetches the Astronomy Picture of the Day from NASA's API with database caching
 * @param date Optional date in YYYY-MM-DD format. If not specified, returns today's APOD
 * @param forceRefresh Force a refresh from the NASA API even if we have cached data
 * @returns Promise with APOD data
 */
export async function fetchApod(date?: string, forceRefresh = false): Promise<ApodResponse> {
  // Get the current date
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');

  // Date format for API requests
  const todayStr = `${year}-${month}-${day}`;
  const targetDate = date || todayStr;

  // Check if we should force refresh
  if (forceRefresh) {
    console.log(`Force refresh requested for APOD. Clearing cache for ${targetDate}`);
    try {
      // Delete any existing cache entry for the target date
      await db.delete(apodCache).where(eq(apodCache.date, targetDate));
      console.log(`Cleared cache entries for ${targetDate}`);
    } catch (err) {
      console.error('Error clearing cache during force refresh:', err);
      // Continue even if clearing fails
    }
  }
  // Check for cached data if not forcing refresh
  else {
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
    console.log(`Fetching APOD data from NASA API for ${targetDate}...`);
    const data = await fetchApodFromNasaApi(targetDate);

    console.log(`NASA API returned APOD data: ${data.title} (${data.date})`);

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

    return data as ApodResponse;
  } catch (error) {
    console.error('NASA API fetch failed:', error);

    // Try to get the most recent cached entry as a fallback
    try {
      const cachedEntries = await db.select().from(apodCache).orderBy(desc(apodCache.cached_at)).limit(1);
      if (cachedEntries.length > 0) {
        console.log('Using most recent cached APOD as fallback');
        return cachedEntries[0] as unknown as ApodResponse;
      }
    } catch (err) {
      console.error('Error fetching fallback from cache:', err);
    }

    // Last resort fallback
    return {
      date: targetDate,
      explanation: "We're experiencing some difficulties loading the NASA Astronomy Picture of the Day. Please try refreshing again or check back later.",
      media_type: "image",
      service_version: "v1",
      title: "NASA APOD Temporarily Unavailable",
      url: "https://apod.nasa.gov/apod/image/0612/sombrero_hst.jpg",
      copyright: "NASA"
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
  const baseUrl = 'https://api.nasa.gov/planetary/apod';
  const params = new URLSearchParams({
    api_key: NASA_API_KEY,
    start_date: startDate,
    end_date: endDate
  });

  const url = `${baseUrl}?${params.toString()}`;

  try {
    console.log(`Fetching APOD range from ${startDate} to ${endDate}...`);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'StellarDiary/1.0 (+https://stellar-diary.vercel.app)'
      }
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`NASA APOD API error ${response.status}: ${text}`);
    }

    const data = await response.json();
    return data as ApodResponse[];
  } catch (error) {
    console.error('Error fetching APOD range:', error);
    throw error;
  }
}
