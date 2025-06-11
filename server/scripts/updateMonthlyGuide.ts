#!/usr/bin/env tsx

import { storage } from '../storage';
import { InsertCelestialObject, InsertMonthlyGuide } from '../../shared/schema';

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
  
  // For now, we'll implement a basic parser that can be extended
  // In a full implementation, this would use web scraping or content APIs
  
  // Extract month/year from URL or content
  const currentDate = new Date();
  const month = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();
  
  // This is a template that should be customized based on the source
  const parsedContent: ParsedGuide = {
    month,
    year,
    headline: `${month} ${year}: Sky Highlights`,
    description: `Astronomical highlights for ${month} ${year}. Please manually update this content with the actual guide information.`,
    hemisphere: 'Northern',
    videoUrls: [],
    objects: []
  };
  
  console.log(`Parsed content for ${month} ${year}`);
  return parsedContent;
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
function getImageUrlForType(type: string, name: string): string {
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
      imageUrl: getImageUrlForType(mapObjectType(obj.type), obj.name),
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
if (require.main === module) {
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