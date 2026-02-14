/**
 * Auto-Populate Orchestrator
 *
 * Combines three sources for monthly sky guide content:
 * 1. Turn Left at Orion (static book data)
 * 2. High Point Scientific YouTube (monthly video)
 * 3. Sky & Telescope YouTube (monthly video)
 *
 * Merges, deduplicates, and checks against existing DB objects.
 */

import { getSeasonalObjects, type TLTOObject } from '../data/turnLeftToOrion';
import { fetchLatestHighPointVideo, fetchLatestSkyTelVideo, type YouTubeVideoResult } from './youtubeApi';
import { extractCelestialObjectsFromText, type ExtractedObject } from './objectExtractor';
import { storage } from '../storage';

export interface AutoPopulateSource {
  name: string;
  status: 'fulfilled' | 'rejected';
  error?: string;
  video?: YouTubeVideoResult;
  objects: SuggestedObject[];
}

export interface SuggestedObject {
  name: string;
  type: string;
  description: string;
  constellation?: string;
  magnitude?: string;
  viewingTips?: string;
  difficulty?: string;
  sources: string[];
  existsInDb: boolean;
  dbId?: number;
}

export interface AutoPopulatePreview {
  month: string;
  year: number;
  sources: AutoPopulateSource[];
  mergedObjects: SuggestedObject[];
  suggestedHeadline: string;
  suggestedDescription: string;
  videoUrls: string[];
}

/**
 * Run all 3 sources in parallel and return a merged preview.
 */
export async function autoPopulatePreview(month: string, year: number): Promise<AutoPopulatePreview> {
  // Run all three sources in parallel
  const [tltoResult, hpResult, stResult] = await Promise.allSettled([
    getTurnLeftToOrionObjects(month),
    getHighPointObjects(month, year),
    getSkyTelescopeObjects(month, year),
  ]);

  const sources: AutoPopulateSource[] = [];
  const videoUrls: string[] = [];

  // Process Turn Left to Orion
  if (tltoResult.status === 'fulfilled') {
    sources.push(tltoResult.value);
  } else {
    sources.push({
      name: 'Turn Left at Orion',
      status: 'rejected',
      error: String(tltoResult.reason),
      objects: [],
    });
  }

  // Process High Point Scientific
  if (hpResult.status === 'fulfilled') {
    sources.push(hpResult.value);
    if (hpResult.value.video) {
      videoUrls.push(hpResult.value.video.videoUrl);
    }
  } else {
    sources.push({
      name: 'High Point Scientific',
      status: 'rejected',
      error: String(hpResult.reason),
      objects: [],
    });
  }

  // Process Sky & Telescope
  if (stResult.status === 'fulfilled') {
    sources.push(stResult.value);
    if (stResult.value.video) {
      videoUrls.push(stResult.value.video.videoUrl);
    }
  } else {
    sources.push({
      name: 'Sky & Telescope',
      status: 'rejected',
      error: String(stResult.reason),
      objects: [],
    });
  }

  // Merge and deduplicate objects across all sources
  const mergedObjects = mergeObjects(sources);

  // Check DB for existing objects
  await checkDbExistence(mergedObjects);

  return {
    month,
    year,
    sources,
    mergedObjects,
    suggestedHeadline: `${month} ${year}: What to See in the Night Sky`,
    suggestedDescription: generateDescription(month, year, mergedObjects, videoUrls),
    videoUrls,
  };
}

async function getTurnLeftToOrionObjects(month: string): Promise<AutoPopulateSource> {
  const tltoObjects = getSeasonalObjects(month);
  const objects: SuggestedObject[] = tltoObjects.map((obj: TLTOObject) => ({
    name: obj.name,
    type: obj.type,
    description: obj.description,
    constellation: obj.constellation,
    magnitude: obj.magnitude,
    viewingTips: obj.viewingTips,
    difficulty: obj.difficulty,
    sources: ['Turn Left at Orion'],
    existsInDb: false,
  }));

  return {
    name: 'Turn Left at Orion',
    status: 'fulfilled',
    objects,
  };
}

async function getHighPointObjects(month: string, year: number): Promise<AutoPopulateSource> {
  const video = await fetchLatestHighPointVideo(month, year);

  if (!video) {
    return {
      name: 'High Point Scientific',
      status: 'fulfilled',
      objects: [],
    };
  }

  const extracted = extractCelestialObjectsFromText(video.description, month);
  const objects: SuggestedObject[] = extracted.map((obj: ExtractedObject) => ({
    ...obj,
    sources: ['High Point Scientific'],
    existsInDb: false,
  }));

  return {
    name: 'High Point Scientific',
    status: 'fulfilled',
    video,
    objects,
  };
}

async function getSkyTelescopeObjects(month: string, year: number): Promise<AutoPopulateSource> {
  const video = await fetchLatestSkyTelVideo(month, year);

  if (!video) {
    return {
      name: 'Sky & Telescope',
      status: 'fulfilled',
      objects: [],
    };
  }

  const extracted = extractCelestialObjectsFromText(video.description, month);
  const objects: SuggestedObject[] = extracted.map((obj: ExtractedObject) => ({
    ...obj,
    sources: ['Sky & Telescope'],
    existsInDb: false,
  }));

  return {
    name: 'Sky & Telescope',
    status: 'fulfilled',
    video,
    objects,
  };
}

/**
 * Merge objects from all sources, deduplicating by name (case-insensitive).
 * When duplicated, merge the sources lists and prefer TLTO viewing tips.
 */
function mergeObjects(sources: AutoPopulateSource[]): SuggestedObject[] {
  const objectMap = new Map<string, SuggestedObject>();

  for (const source of sources) {
    for (const obj of source.objects) {
      const key = obj.name.toLowerCase();
      const existing = objectMap.get(key);
      if (existing) {
        // Merge sources
        for (const s of obj.sources) {
          if (!existing.sources.includes(s)) {
            existing.sources.push(s);
          }
        }
        // Prefer TLTO viewing tips if available
        if (obj.viewingTips && !existing.viewingTips) {
          existing.viewingTips = obj.viewingTips;
        }
        if (obj.difficulty && !existing.difficulty) {
          existing.difficulty = obj.difficulty;
        }
        // Prefer more detailed description
        if (obj.description.length > existing.description.length) {
          existing.description = obj.description;
        }
        // Fill in missing fields
        if (obj.constellation && !existing.constellation) {
          existing.constellation = obj.constellation;
        }
        if (obj.magnitude && !existing.magnitude) {
          existing.magnitude = obj.magnitude;
        }
      } else {
        objectMap.set(key, { ...obj });
      }
    }
  }

  return Array.from(objectMap.values());
}

/**
 * Check each object against the database and mark existsInDb / dbId.
 */
async function checkDbExistence(objects: SuggestedObject[]): Promise<void> {
  for (const obj of objects) {
    try {
      const existing = await storage.getCelestialObjectByName(obj.name);
      if (existing) {
        obj.existsInDb = true;
        obj.dbId = existing.id;
      }
    } catch {
      // DB check failed, leave as false
    }
  }
}

function generateDescription(month: string, year: number, objects: SuggestedObject[], videoUrls: string[]): string {
  const objectCount = objects.length;
  const types = new Set(objects.map(o => o.type));
  const typeList = Array.from(types).join(', ');

  let desc = `Your guide to the ${month} ${year} night sky featuring ${objectCount} celestial objects`;
  if (typeList) {
    desc += ` including ${typeList}`;
  }
  desc += '.';

  if (videoUrls.length > 0) {
    desc += ` Includes video guides from astronomy experts.`;
  }

  return desc;
}
