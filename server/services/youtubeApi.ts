/**
 * YouTube Data API v3 Integration
 *
 * Fetches monthly astronomy videos from:
 * - High Point Scientific (channel search)
 * - Sky & Telescope (playlist)
 *
 * Requires YOUTUBE_API_KEY environment variable.
 * Each auto-populate uses ~2-4 API units (search + playlist).
 */

export interface YouTubeVideoResult {
  videoId: string;
  title: string;
  description: string;
  videoUrl: string;
  channelTitle: string;
}

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// High Point Scientific channel ID
const HIGH_POINT_CHANNEL_ID = 'UC1bUfNsIxfXmaCBPkeMkaxg';

// Sky & Telescope monthly playlist
const SKY_TEL_PLAYLIST_ID = 'PLjjX7u93iVQsau_F2CDOs53aQZK16rBgI';

function getApiKey(): string | null {
  return process.env.YOUTUBE_API_KEY || null;
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Fetch the latest High Point Scientific "What's in the Sky" video for a given month.
 * Searches their channel for the monthly sky guide video.
 */
export async function fetchLatestHighPointVideo(month: string, year: number): Promise<YouTubeVideoResult | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.log('YOUTUBE_API_KEY not set, skipping High Point Scientific video fetch');
    return null;
  }

  try {
    const searchQuery = `${month} ${year} what's in the sky`;
    const params = new URLSearchParams({
      part: 'snippet',
      channelId: HIGH_POINT_CHANNEL_ID,
      q: searchQuery,
      type: 'video',
      maxResults: '3',
      order: 'date',
      key: apiKey,
    });

    const response = await fetch(`${YOUTUBE_API_BASE}/search?${params}`);
    if (!response.ok) {
      console.error(`YouTube search API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    const items = data.items;
    if (!items || items.length === 0) {
      console.log(`No High Point Scientific video found for ${month} ${year}`);
      return null;
    }

    // Find the best match - look for the monthly guide video
    const monthLower = month.toLowerCase();
    const bestMatch = items.find((item: any) => {
      const title = item.snippet?.title?.toLowerCase() || '';
      return title.includes(monthLower) && (
        title.includes("what's in the sky") ||
        title.includes('night sky') ||
        title.includes('monthly')
      );
    }) || items[0];

    const videoId = bestMatch.id?.videoId;
    if (!videoId) return null;

    // Fetch full video details to get complete description
    const detailParams = new URLSearchParams({
      part: 'snippet',
      id: videoId,
      key: apiKey,
    });

    const detailResponse = await fetch(`${YOUTUBE_API_BASE}/videos?${detailParams}`);
    if (!detailResponse.ok) {
      // Fall back to search snippet
      return {
        videoId,
        title: bestMatch.snippet?.title || '',
        description: bestMatch.snippet?.description || '',
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        channelTitle: bestMatch.snippet?.channelTitle || 'High Point Scientific',
      };
    }

    const detailData = await detailResponse.json();
    const video = detailData.items?.[0];

    return {
      videoId,
      title: video?.snippet?.title || bestMatch.snippet?.title || '',
      description: video?.snippet?.description || bestMatch.snippet?.description || '',
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      channelTitle: video?.snippet?.channelTitle || 'High Point Scientific',
    };
  } catch (error) {
    console.error('Error fetching High Point Scientific video:', error);
    return null;
  }
}

/**
 * Fetch the latest Sky & Telescope monthly video from their playlist.
 * Uses the playlist API to get recent items and matches by month/year.
 */
export async function fetchLatestSkyTelVideo(month: string, year: number): Promise<YouTubeVideoResult | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.log('YOUTUBE_API_KEY not set, skipping Sky & Telescope video fetch');
    return null;
  }

  try {
    const params = new URLSearchParams({
      part: 'snippet',
      playlistId: SKY_TEL_PLAYLIST_ID,
      maxResults: '10',
      key: apiKey,
    });

    const response = await fetch(`${YOUTUBE_API_BASE}/playlistItems?${params}`);
    if (!response.ok) {
      console.error(`YouTube playlist API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    const items = data.items;
    if (!items || items.length === 0) {
      console.log('No Sky & Telescope playlist items found');
      return null;
    }

    // Find the video matching our target month/year
    const monthLower = month.toLowerCase();
    const bestMatch = items.find((item: any) => {
      const title = item.snippet?.title?.toLowerCase() || '';
      const desc = item.snippet?.description?.toLowerCase() || '';
      return (title.includes(monthLower) || desc.includes(monthLower)) &&
             (title.includes(year.toString()) || desc.includes(year.toString()));
    });

    if (!bestMatch) {
      console.log(`No Sky & Telescope video found for ${month} ${year}`);
      return null;
    }

    const videoId = bestMatch.snippet?.resourceId?.videoId;
    if (!videoId) return null;

    // Fetch full video details to get complete description
    const detailParams = new URLSearchParams({
      part: 'snippet',
      id: videoId,
      key: apiKey,
    });

    const detailResponse = await fetch(`${YOUTUBE_API_BASE}/videos?${detailParams}`);
    if (!detailResponse.ok) {
      return {
        videoId,
        title: bestMatch.snippet?.title || '',
        description: bestMatch.snippet?.description || '',
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        channelTitle: bestMatch.snippet?.channelTitle || 'Sky & Telescope',
      };
    }

    const detailData = await detailResponse.json();
    const video = detailData.items?.[0];

    return {
      videoId,
      title: video?.snippet?.title || bestMatch.snippet?.title || '',
      description: video?.snippet?.description || bestMatch.snippet?.description || '',
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      channelTitle: video?.snippet?.channelTitle || 'Sky & Telescope',
    };
  } catch (error) {
    console.error('Error fetching Sky & Telescope video:', error);
    return null;
  }
}
