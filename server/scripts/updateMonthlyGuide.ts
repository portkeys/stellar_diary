#!/usr/bin/env tsx

import { storage } from '../storage';
import { InsertCelestialObject, InsertMonthlyGuide } from '../../shared/schema';
import { searchCelestialObjectImage } from '../services/nasaImages';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface ParsedObject {
  name: string;
  type: string;
  description: string;
  constellation?: string;
  magnitude?: string;
  coordinates?: string;
  visibility?: string;
  tips?: string;
}

interface ParsedGuide {
  month: string;
  year: number;
  headline: string;
  description: string;
  hemisphere: string;
  videoUrls: string[];
  objects: ParsedObject[];
}

/**
 * Parses astronomical content from a URL and extracts celestial objects and guide information
 */
async function parseAstronomicalContent(url: string): Promise<ParsedGuide> {
  console.log(`Parsing content from: ${url}`);

  try {
    // Fetch the content from the URL
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);

    // Extract title and date information
    const title = $('h1').first().text().trim();
    const monthMatch = title.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i);

    let month = 'June';
    let year = 2025;

    if (monthMatch) {
      month = monthMatch[1];
      year = parseInt(monthMatch[2]);
    }

    // Extract YouTube video URLs
    const videoUrls: string[] = [];
    $('iframe[src*="youtube.com"], iframe[src*="youtu.be"]').each((_, element) => {
      const src = $(element).attr('src');
      if (src) {
        videoUrls.push(src.replace('/embed/', '/watch?v=').split('?')[0] + '?v=' + src.split('/').pop()?.split('?')[0]);
      }
    });

    // Extract content sections and celestial objects
    const objects: ParsedObject[] = [];
    const contentSections: string[] = [];

    // Look for celestial object sections (headings followed by descriptions)
    $('h3, h4').each((_, element) => {
      const heading = $(element).text().trim();
      const nextElements = $(element).nextUntil('h1, h2, h3, h4');
      const description = nextElements.text().trim();

      if (heading && description) {
        contentSections.push(`${heading}\n\n${description}`);

        // Extract celestial objects from headings
        const objectName = extractObjectName(heading);
        if (objectName) {
          const objectType = determineObjectType(heading, description);

          objects.push({
            name: objectName,
            type: objectType,
            description: description.substring(0, 500) + (description.length > 500 ? '...' : ''),
            visibility: extractVisibilityInfo(description),
            tips: extractObservingTips(description)
          });
        }
      }
    });

    // Extract main description from the content
    const mainDescription = extractMainDescription($, contentSections);

    const parsedContent: ParsedGuide = {
      month,
      year,
      headline: title || `${month} ${year}: Sky Highlights`,
      description: mainDescription,
      hemisphere: 'Northern',
      videoUrls,
      objects
    };

    console.log(`Successfully parsed content for ${month} ${year} with ${objects.length} objects`);
    return parsedContent;

  } catch (error) {
    console.error('Error parsing content:', error);

    // Fallback to basic parsing
    const currentDate = new Date();
    const month = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();

    return {
      month,
      year,
      headline: `${month} ${year}: Sky Highlights`,
      description: `Astronomical highlights for ${month} ${year}. Content parsing encountered an issue - please manually update this guide.`,
      hemisphere: 'Northern',
      videoUrls: [],
      objects: []
    };
  }
}

/**
 * Extracts object name from heading text
 */
function extractObjectName(heading: string): string | null {
  // Remove common prefixes and clean up the name
  const cleanHeading = heading
    .replace(/^(Messier|M)\s*/i, 'M')
    .replace(/^(NGC|IC)\s*/i, '')
    .replace(/\s*-\s*.*$/, '') // Remove everything after dash
    .trim();

  // Look for common object patterns
  if (cleanHeading.match(/^M\s*\d+/i)) {
    return cleanHeading.replace(/\s+/g, ' ');
  }

  if (cleanHeading.match(/^(NGC|IC)\s*\d+/i)) {
    return cleanHeading;
  }

  // For named objects (e.g., "Graffias", "Regulus")
  if (cleanHeading.match(/^[A-Za-z\s]+$/)) {
    return cleanHeading.split(' ')[0]; // Take first word as name
  }

  return null;
}

/**
 * Determines object type based on heading and description
 */
function determineObjectType(heading: string, description: string): string {
  const text = (heading + ' ' + description).toLowerCase();

  if (text.includes('cluster') && (text.includes('globular') || text.includes('hercules'))) {
    return 'star_cluster';
  }
  if (text.includes('galaxy') || text.includes('spiral') || text.includes('spindle')) {
    return 'galaxy';
  }
  if (text.includes('nebula')) {
    return 'nebula';
  }
  if (text.includes('double') && text.includes('star')) {
    return 'double_star';
  }
  if (text.includes('planet') || text.includes('mars') || text.includes('jupiter') || text.includes('saturn')) {
    return 'planet';
  }
  if (text.includes('cluster') || text.includes('beehive')) {
    return 'star_cluster';
  }

  return 'other';
}

/**
 * Extracts visibility information from description
 */
function extractVisibilityInfo(description: string): string | undefined {
  const visibilityPatterns = [
    /visible.*?(\d+x?\s*magnification|binoculars?|telescope)/i,
    /best.*?seen.*?(binoculars?|telescope|naked eye)/i,
    /(magnitude|mag)\s*[\d.]+/i
  ];

  for (const pattern of visibilityPatterns) {
    const match = description.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return undefined;
}

/**
 * Extracts observing tips from description
 */
function extractObservingTips(description: string): string | undefined {
  const sentences = description.split(/[.!?]+/);
  const tipSentences = sentences.filter(sentence => {
    const lower = sentence.toLowerCase();
    return lower.includes('magnification') ||
           lower.includes('telescope') ||
           lower.includes('binoculars') ||
           lower.includes('look for') ||
           lower.includes('observe') ||
           lower.includes('viewing');
  });

  return tipSentences.length > 0 ? tipSentences.join('. ').trim() + '.' : undefined;
}

/**
 * Extracts main description from content
 */
function extractMainDescription($: cheerio.CheerioAPI, contentSections: string[]): string {
  // Try to find main content paragraphs
  const mainParagraphs: string[] = [];

  $('p').each((_, element) => {
    const text = $(element).text().trim();
    if (text.length > 100 && !text.includes('©') && !text.includes('Image credit')) {
      mainParagraphs.push(text);
    }
  });

  if (mainParagraphs.length > 0) {
    return mainParagraphs.slice(0, 3).join('\n\n');
  }

  // Fallback to content sections
  return contentSections.slice(0, 2).join('\n\n');
}

/**
 * Maps object type names to standardized database types
 */
function mapObjectType(type: string): string {
  const typeMap: { [key: string]: string } = {
    'planet': 'planet',
    'star': 'star',
    'double star': 'double_star',
    'galaxy': 'galaxy',
    'nebula': 'nebula',
    'cluster': 'star_cluster',
    'globular cluster': 'star_cluster',
    'open cluster': 'star_cluster',
    'star cluster': 'star_cluster',
    'other': 'other'
  };

  const lowerType = type.toLowerCase();
  return typeMap[lowerType] || 'other';
}

/**
 * Generates appropriate image URL for celestial object type
 */
async function getImageUrlForObject(type: string, name: string): Promise<string> {
  // First try to search for NASA image
  try {
    const nasaResult = await searchCelestialObjectImage(name);
    if (nasaResult.success && nasaResult.image_url) {
      console.log(`✓ Found NASA image for ${name}: ${nasaResult.image_url}`);
      return nasaResult.image_url;
    }
  } catch (error) {
    console.log(`⚠ NASA image search failed for ${name}, using fallback`);
  }

  // Fallback to type-based images
  const baseUrls: { [key: string]: string } = {
    'planet': 'https://images.unsplash.com/photo-1614732414444-096040ec8739?auto=format&fit=crop&w=600&h=300',
    'star': 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=600&h=300',
    'galaxy': 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?auto=format&fit=crop&w=600&h=300',
    'nebula': 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=600&h=300',
    'star_cluster': 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=600&h=300'
  };

  return baseUrls[type] || baseUrls['star'];
}

/**
 * Adds celestial objects to the database
 */
async function addCelestialObjects(objects: ParsedObject[], month: string): Promise<void> {
  console.log(`Adding ${objects.length} celestial objects for ${month}`);

  for (const obj of objects) {
    const celestialObject: InsertCelestialObject = {
      name: obj.name,
      type: mapObjectType(obj.type),
      description: obj.description,
      coordinates: obj.coordinates || 'Coordinates to be determined',
      bestViewingTime: 'Evening hours',
      imageUrl: await getImageUrlForObject(mapObjectType(obj.type), obj.name),
      visibilityRating: obj.visibility || 'Good Visibility',
      information: obj.tips || '',
      constellation: obj.constellation || 'Various',
      magnitude: obj.magnitude || '',
      hemisphere: 'Both',
      recommendedEyepiece: 'Medium power recommended',
      month: month
    };

    try {
      await storage.createCelestialObject(celestialObject);
      console.log(`✓ Added ${obj.name} (${obj.type})`);
    } catch (error) {
      console.log(`⚠ Skipped ${obj.name} (may already exist)`);
    }
  }
}

/**
 * Updates the monthly guide in the database
 */
async function updateMonthlyGuide(guide: ParsedGuide): Promise<void> {
  console.log(`Updating monthly guide for ${guide.month} ${guide.year}`);

  const monthlyGuide: InsertMonthlyGuide = {
    month: guide.month,
    year: guide.year,
    headline: guide.headline,
    description: guide.description,
    hemisphere: guide.hemisphere,
    videoUrls: guide.videoUrls,
    isAdmin: true
  };

  try {
    await storage.createMonthlyGuide(monthlyGuide);
    console.log(`✓ Created new monthly guide for ${guide.month} ${guide.year}`);
  } catch (error) {
    console.log(`⚠ Monthly guide may already exist, skipping creation`);
  }
}

/**
 * Main function to update monthly guide from URL
 */
export async function updateMonthlyGuideFromUrl(url: string): Promise<{
  success: boolean;
  message: string;
  objectsAdded: number;
  guideUpdated: boolean;
}> {
  try {
    console.log('Starting monthly guide update process...');

    // Parse content from URL
    const parsedContent = await parseAstronomicalContent(url);

    // Add celestial objects
    await addCelestialObjects(parsedContent.objects, parsedContent.month);

    // Update monthly guide
    await updateMonthlyGuide(parsedContent);

    console.log('Monthly guide update completed successfully!');

    return {
      success: true,
      message: `Successfully updated ${parsedContent.month} ${parsedContent.year} guide`,
      objectsAdded: parsedContent.objects.length,
      guideUpdated: true
    };

  } catch (error) {
    console.error('Error updating monthly guide:', error);
    return {
      success: false,
      message: `Failed to update monthly guide: ${error instanceof Error ? error.message : 'Unknown error'}`,
      objectsAdded: 0,
      guideUpdated: false
    };
  }
}

/**
 * Command line interface
 */
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  const url = process.argv[2];

  if (!url) {
    console.error('Usage: tsx updateMonthlyGuide.ts <url>');
    process.exit(1);
  }

  updateMonthlyGuideFromUrl(url)
    .then(result => {
      console.log('\n' + '='.repeat(50));
      console.log('MONTHLY GUIDE UPDATE RESULTS');
      console.log('='.repeat(50));
      console.log(`Status: ${result.success ? '✓ SUCCESS' : '✗ FAILED'}`);
      console.log(`Message: ${result.message}`);
      console.log(`Objects Added: ${result.objectsAdded}`);
      console.log(`Guide Updated: ${result.guideUpdated ? 'Yes' : 'No'}`);
      console.log('='.repeat(50));

      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}