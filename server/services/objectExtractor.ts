/**
 * Celestial Object Text Extraction
 *
 * Extracts celestial object references (Messier, NGC, IC, planets, named objects)
 * from arbitrary text content. Used by URL import and auto-populate features.
 */

export interface ExtractedObject {
  name: string;
  type: string;
  description: string;
  constellation?: string;
  magnitude?: string;
}

// Messier object data
const messierData: Record<number, { type: string; description: string; constellation: string; magnitude: string }> = {
  1: { type: 'nebula', description: 'The Crab Nebula - a supernova remnant from 1054 AD.', constellation: 'Taurus', magnitude: '8.4' },
  8: { type: 'nebula', description: 'The Lagoon Nebula - a giant interstellar cloud.', constellation: 'Sagittarius', magnitude: '6.0' },
  13: { type: 'star_cluster', description: 'The Great Hercules Cluster - one of the brightest globular clusters.', constellation: 'Hercules', magnitude: '5.8' },
  16: { type: 'nebula', description: 'The Eagle Nebula - contains the Pillars of Creation.', constellation: 'Serpens', magnitude: '6.4' },
  17: { type: 'nebula', description: 'The Omega Nebula - a bright emission nebula.', constellation: 'Sagittarius', magnitude: '6.0' },
  20: { type: 'nebula', description: 'The Trifid Nebula - a combination emission, reflection, and dark nebula.', constellation: 'Sagittarius', magnitude: '6.3' },
  27: { type: 'nebula', description: 'The Dumbbell Nebula - a planetary nebula.', constellation: 'Vulpecula', magnitude: '7.5' },
  31: { type: 'galaxy', description: 'The Andromeda Galaxy - nearest major galaxy to the Milky Way.', constellation: 'Andromeda', magnitude: '3.4' },
  33: { type: 'galaxy', description: 'The Triangulum Galaxy - a spiral galaxy.', constellation: 'Triangulum', magnitude: '5.7' },
  42: { type: 'nebula', description: 'The Orion Nebula - one of the brightest nebulae visible to the naked eye.', constellation: 'Orion', magnitude: '4.0' },
  44: { type: 'star_cluster', description: 'The Beehive Cluster - an open cluster in Cancer.', constellation: 'Cancer', magnitude: '3.7' },
  45: { type: 'star_cluster', description: 'The Pleiades - the Seven Sisters open cluster.', constellation: 'Taurus', magnitude: '1.6' },
  51: { type: 'galaxy', description: 'The Whirlpool Galaxy - a grand-design spiral galaxy.', constellation: 'Canes Venatici', magnitude: '8.4' },
  57: { type: 'nebula', description: 'The Ring Nebula - a planetary nebula.', constellation: 'Lyra', magnitude: '8.8' },
  81: { type: 'galaxy', description: "Bode's Galaxy - a grand design spiral galaxy.", constellation: 'Ursa Major', magnitude: '6.9' },
  82: { type: 'galaxy', description: 'The Cigar Galaxy - a starburst galaxy.', constellation: 'Ursa Major', magnitude: '8.4' },
  101: { type: 'galaxy', description: 'The Pinwheel Galaxy - a face-on spiral galaxy.', constellation: 'Ursa Major', magnitude: '7.9' },
  104: { type: 'galaxy', description: 'The Sombrero Galaxy - distinctive for its bright nucleus.', constellation: 'Virgo', magnitude: '8.0' },
};

const galaxyNumbers = [31, 32, 33, 49, 51, 58, 59, 60, 61, 63, 64, 65, 66, 74, 77, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 94, 95, 96, 98, 99, 100, 101, 104, 105, 106, 108, 109, 110];
const nebulaeNumbers = [1, 8, 16, 17, 20, 27, 42, 43, 57, 76, 78, 97];

const planetData: Record<string, { description: string; magnitude: string }> = {
  Mercury: { description: 'Mercury - the smallest planet, visible during twilight.', magnitude: '-1.9 to 5.7' },
  Venus: { description: 'Venus - the brightest planet, the morning or evening star.', magnitude: '-4.9 to -3.8' },
  Mars: { description: 'Mars - the Red Planet, showing surface features through telescopes.', magnitude: '-2.9 to 1.8' },
  Jupiter: { description: 'Jupiter - the largest planet with cloud bands and Galilean moons.', magnitude: '-2.9 to -1.6' },
  Saturn: { description: 'Saturn - the ringed planet, spectacular through a telescope.', magnitude: '-0.5 to 1.5' },
  Uranus: { description: 'Uranus - an ice giant appearing as a blue-green disc.', magnitude: '5.3 to 6.0' },
  Neptune: { description: 'Neptune - the most distant planet, requiring a telescope.', magnitude: '7.8 to 8.0' },
};

const namedObjects: Record<string, { type: string; description: string; constellation: string }> = {
  'Orion Nebula': { type: 'nebula', description: 'The Orion Nebula (M42) - a diffuse nebula south of Orion\'s Belt.', constellation: 'Orion' },
  'Andromeda Galaxy': { type: 'galaxy', description: 'The Andromeda Galaxy (M31) - nearest major galaxy to the Milky Way.', constellation: 'Andromeda' },
  'Pleiades': { type: 'star_cluster', description: 'The Pleiades (M45) - the Seven Sisters open cluster.', constellation: 'Taurus' },
  'Ring Nebula': { type: 'nebula', description: 'The Ring Nebula (M57) - a planetary nebula in Lyra.', constellation: 'Lyra' },
  'Whirlpool Galaxy': { type: 'galaxy', description: 'The Whirlpool Galaxy (M51) - a grand-design spiral galaxy.', constellation: 'Canes Venatici' },
  'Lagoon Nebula': { type: 'nebula', description: 'The Lagoon Nebula (M8) - a giant interstellar cloud.', constellation: 'Sagittarius' },
  'Eagle Nebula': { type: 'nebula', description: 'The Eagle Nebula (M16) - contains the Pillars of Creation.', constellation: 'Serpens' },
  'Crab Nebula': { type: 'nebula', description: 'The Crab Nebula (M1) - a supernova remnant from 1054 AD.', constellation: 'Taurus' },
  'Hercules Cluster': { type: 'star_cluster', description: 'The Great Hercules Cluster (M13) - a bright globular cluster.', constellation: 'Hercules' },
  'Beehive Cluster': { type: 'star_cluster', description: 'The Beehive Cluster (M44) - an open cluster in Cancer.', constellation: 'Cancer' },
  'Double Cluster': { type: 'star_cluster', description: 'The Double Cluster - NGC 869 and NGC 884 in Perseus.', constellation: 'Perseus' },
  'Dumbbell Nebula': { type: 'nebula', description: 'The Dumbbell Nebula (M27) - a bright planetary nebula.', constellation: 'Vulpecula' },
  'Sombrero Galaxy': { type: 'galaxy', description: 'The Sombrero Galaxy (M104) - galaxy with bright nucleus.', constellation: 'Virgo' },
};

export function extractCelestialObjectsFromText(text: string, month: string): ExtractedObject[] {
  const objects: ExtractedObject[] = [];
  const foundNames = new Set<string>();

  // Messier objects (M1, M31, etc.)
  const messierPattern = /\b(M|Messier\s*)(\d{1,3})\b/gi;
  let match;
  while ((match = messierPattern.exec(text)) !== null) {
    const num = parseInt(match[2]);
    const name = `M${num}`;
    if (!foundNames.has(name)) {
      foundNames.add(name);
      const data = messierData[num];
      if (data) {
        objects.push({ name, ...data });
      } else {
        let type = 'star_cluster';
        if (galaxyNumbers.includes(num)) type = 'galaxy';
        if (nebulaeNumbers.includes(num)) type = 'nebula';
        objects.push({
          name,
          type,
          description: `Messier ${num} - a deep sky object in the Messier catalog.`,
          constellation: 'Various',
          magnitude: 'Variable'
        });
      }
    }
  }

  // NGC objects
  const ngcPattern = /\bNGC\s*(\d{1,4})\b/gi;
  while ((match = ngcPattern.exec(text)) !== null) {
    const name = `NGC ${match[1]}`;
    if (!foundNames.has(name)) {
      foundNames.add(name);
      objects.push({
        name,
        type: 'galaxy',
        description: `NGC ${match[1]} - a deep sky object visible in ${month}.`,
      });
    }
  }

  // IC objects
  const icPattern = /\bIC\s*(\d{1,4})\b/gi;
  while ((match = icPattern.exec(text)) !== null) {
    const name = `IC ${match[1]}`;
    if (!foundNames.has(name)) {
      foundNames.add(name);
      objects.push({
        name,
        type: 'nebula',
        description: `IC ${match[1]} - a deep sky object visible in ${month}.`,
      });
    }
  }

  // Planets
  for (const [planet, data] of Object.entries(planetData)) {
    const planetPattern = new RegExp(`\\b${planet}\\b`, 'gi');
    if (planetPattern.test(text) && !foundNames.has(planet)) {
      foundNames.add(planet);
      objects.push({
        name: planet,
        type: 'planet',
        description: data.description,
        magnitude: data.magnitude,
      });
    }
  }

  // Named deep sky objects
  for (const [name, info] of Object.entries(namedObjects)) {
    const pattern = new RegExp(name, 'gi');
    if (pattern.test(text) && !foundNames.has(name)) {
      foundNames.add(name);
      objects.push({ name, ...info });
    }
  }

  return objects;
}
