/**
 * NASA Images API Integration Module (Node.js)
 *
 * This module provides functions to search for images from NASA's Image and Video Library API
 * and Wikipedia as a fallback. Replaces the Python implementation for Vercel compatibility.
 */

export interface NasaImageSearchResult {
  success: boolean;
  object_name: string;
  image_url: string | null;
  error?: string;
  source?: 'nasa' | 'wikipedia';
  metadata?: {
    title: string;
    description: string;
    date_created: string;
    center: string;
    nasa_id: string;
  };
}

interface NasaApiResponse {
  collection: {
    items: Array<{
      href: string;
      data: Array<{
        nasa_id: string;
        title: string;
        description?: string;
        date_created?: string;
        center?: string;
      }>;
      links?: Array<{
        href: string;
        rel: string;
        render?: string;
      }>;
    }>;
  };
}

interface NasaAssetResponse {
  collection: {
    items: Array<{
      href: string;
    }>;
  };
}

interface WikipediaApiResponse {
  query?: {
    pages: Record<string, {
      pageid?: number;
      title: string;
      thumbnail?: {
        source: string;
        width: number;
        height: number;
      };
    }>;
  };
}

/**
 * Make API request with retry logic and error handling
 */
async function makeApiRequest<T>(url: string, maxRetries: number = 3): Promise<T | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'StellarDiary/1.0 (+https://stellar-diary.vercel.app)'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json() as T;
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      if (attempt < maxRetries - 1) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  console.error(`All ${maxRetries} attempts failed`);
  return null;
}

/**
 * Search NASA Image and Video Library for images matching the query
 */
async function searchNasaImagesData(query: string, size: number = 3): Promise<NasaApiResponse | null> {
  const params = new URLSearchParams({
    q: query,
    media_type: 'image',
    page: '1',
    page_size: size.toString()
  });

  const url = `https://images-api.nasa.gov/search?${params.toString()}`;
  return makeApiRequest<NasaApiResponse>(url);
}

/**
 * Extract the best image URL from NASA API response
 */
async function extractBestImageUrl(apiResponse: NasaApiResponse): Promise<string | null> {
  try {
    const items = apiResponse.collection?.items;
    if (!items || items.length === 0) {
      return null;
    }

    const firstItem = items[0];
    const nasaId = firstItem.data?.[0]?.nasa_id;

    if (!nasaId) {
      // Fallback to preview link if available
      const previewLink = firstItem.links?.find(link => link.rel === 'preview');
      return previewLink?.href || null;
    }

    // Fetch asset manifest to get image URLs
    const assetUrl = `https://images-api.nasa.gov/asset/${nasaId}`;
    const assetResponse = await makeApiRequest<NasaAssetResponse>(assetUrl);

    if (!assetResponse) {
      // Fallback to preview link
      const previewLink = firstItem.links?.find(link => link.rel === 'preview');
      return previewLink?.href || null;
    }

    const assetItems = assetResponse.collection?.items || [];

    // Prefer high-resolution images
    let bestUrl: string | null = null;
    for (const item of assetItems) {
      const href = item.href;
      if (href.endsWith('.jpg') || href.endsWith('.jpeg') || href.endsWith('.png')) {
        // Prefer larger images
        if (href.toLowerCase().includes('large') || href.includes('1024') || href.includes('2048')) {
          bestUrl = href;
          break;
        } else if (!bestUrl) {
          bestUrl = href;
        }
      }
    }

    return bestUrl;
  } catch (error) {
    console.error('Error extracting image URL:', error);
    return null;
  }
}

/**
 * Search Wikipedia for a page matching the object name and return the thumbnail image URL
 */
async function searchWikipediaImage(objectName: string): Promise<{ success: boolean; image_url: string | null; title: string }> {
  try {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      prop: 'pageimages',
      piprop: 'thumbnail',
      pithumbsize: '800',
      titles: objectName,
      redirects: '1',
      origin: '*'  // Required for CORS
    });

    const url = `https://en.wikipedia.org/w/api.php?${params.toString()}`;
    const response = await makeApiRequest<WikipediaApiResponse>(url);

    if (!response?.query?.pages) {
      return { success: false, image_url: null, title: objectName };
    }

    const pages = response.query.pages;
    for (const pageId in pages) {
      const page = pages[pageId];
      if (page.thumbnail?.source) {
        return {
          success: true,
          image_url: page.thumbnail.source,
          title: page.title || objectName
        };
      }
    }

    return { success: false, image_url: null, title: objectName };
  } catch (error) {
    console.error(`Wikipedia image search failed for ${objectName}:`, error);
    return { success: false, image_url: null, title: objectName };
  }
}

/**
 * Search for a celestial object image - tries NASA first, then Wikipedia
 */
export async function searchCelestialObjectImage(objectName: string): Promise<NasaImageSearchResult> {
  try {
    console.log(`Searching for image (NASA/Wikipedia) for: ${objectName}`);

    // Try NASA first
    const searchResult = await searchNasaImagesData(objectName, 3);

    if (searchResult) {
      const imageUrl = await extractBestImageUrl(searchResult);

      if (imageUrl) {
        const items = searchResult.collection?.items || [];
        const data = items[0]?.data?.[0];

        return {
          success: true,
          object_name: objectName,
          image_url: imageUrl,
          source: 'nasa',
          metadata: {
            title: data?.title || '',
            description: data?.description || '',
            date_created: data?.date_created || '',
            center: data?.center || '',
            nasa_id: data?.nasa_id || ''
          }
        };
      }
    }

    // Fallback to Wikipedia
    console.log(`NASA search failed for ${objectName}, trying Wikipedia...`);
    const wikiResult = await searchWikipediaImage(objectName);

    if (wikiResult.success && wikiResult.image_url) {
      return {
        success: true,
        object_name: objectName,
        image_url: wikiResult.image_url,
        source: 'wikipedia',
        metadata: {
          title: wikiResult.title,
          description: '',
          date_created: '',
          center: '',
          nasa_id: ''
        }
      };
    }

    // Both failed
    return {
      success: false,
      object_name: objectName,
      image_url: null,
      error: 'No suitable image found in NASA or Wikipedia database'
    };
  } catch (error) {
    console.error(`Error searching for image for ${objectName}:`, error);
    return {
      success: false,
      object_name: objectName,
      image_url: null,
      error: `Failed to search for image: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Preview NASA image search results without updating the database
 */
export async function previewCelestialObjectImageSearch(objectName: string): Promise<NasaImageSearchResult> {
  return searchCelestialObjectImage(objectName);
}
