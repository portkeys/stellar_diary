/**
 * Turn Left at Orion - Curated Object Catalog
 *
 * Objects from the popular amateur astronomy guidebook "Turn Left at Orion"
 * by Guy Consolmagno and Dan M. Davis. Organized by best viewing season
 * for Northern Hemisphere observers.
 *
 * Difficulty: 'easy' (naked eye/binoculars), 'moderate' (small telescope),
 *            'challenging' (requires patience/good conditions)
 */

export type Season = 'winter' | 'spring' | 'summer' | 'fall';
export type Difficulty = 'easy' | 'moderate' | 'challenging';

export interface TLTOObject {
  name: string;
  commonName?: string;
  type: string;
  constellation: string;
  magnitude: string;
  difficulty: Difficulty;
  description: string;
  viewingTips: string;
}

// Season-to-month mapping (months that belong to each season)
const seasonMonths: Record<Season, string[]> = {
  winter: ['December', 'January', 'February'],
  spring: ['March', 'April', 'May'],
  summer: ['June', 'July', 'August'],
  fall: ['September', 'October', 'November'],
};

// Transition months get objects from adjacent seasons too
const transitionOverlap: Record<string, Season[]> = {
  'March': ['winter', 'spring'],
  'June': ['spring', 'summer'],
  'September': ['summer', 'fall'],
  'December': ['fall', 'winter'],
};

const winterObjects: TLTOObject[] = [
  { name: 'M42', commonName: 'Orion Nebula', type: 'nebula', constellation: 'Orion', magnitude: '4.0', difficulty: 'easy', description: 'The Great Orion Nebula - a vast stellar nursery visible to the naked eye.', viewingTips: 'Use low power to see the full extent. Look for the Trapezium star cluster at the center.' },
  { name: 'M43', commonName: 'De Mairan\'s Nebula', type: 'nebula', constellation: 'Orion', magnitude: '9.0', difficulty: 'moderate', description: 'A region of the Orion Nebula separated by a dark dust lane.', viewingTips: 'Look just north of M42 for this comma-shaped glow.' },
  { name: 'M1', commonName: 'Crab Nebula', type: 'nebula', constellation: 'Taurus', magnitude: '8.4', difficulty: 'moderate', description: 'Supernova remnant from a stellar explosion recorded in 1054 AD.', viewingTips: 'Appears as an oval glow. Use averted vision for best results.' },
  { name: 'M45', commonName: 'Pleiades', type: 'star_cluster', constellation: 'Taurus', magnitude: '1.6', difficulty: 'easy', description: 'The Seven Sisters - one of the nearest open clusters to Earth.', viewingTips: 'Best in binoculars or a wide-field eyepiece. Count how many stars you can resolve.' },
  { name: 'M35', type: 'star_cluster', constellation: 'Gemini', magnitude: '5.3', difficulty: 'easy', description: 'A rich open cluster near Castor\'s foot in Gemini.', viewingTips: 'Look for the smaller cluster NGC 2158 nearby as a bonus.' },
  { name: 'M36', type: 'star_cluster', constellation: 'Auriga', magnitude: '6.3', difficulty: 'easy', description: 'A compact open cluster in Auriga.', viewingTips: 'Part of the Auriga cluster trio with M37 and M38.' },
  { name: 'M37', type: 'star_cluster', constellation: 'Auriga', magnitude: '6.2', difficulty: 'easy', description: 'The richest of the three Auriga clusters with a striking red star at center.', viewingTips: 'Best of the Auriga trio. Look for the orange central star.' },
  { name: 'M38', type: 'star_cluster', constellation: 'Auriga', magnitude: '7.4', difficulty: 'easy', description: 'An open cluster with stars arranged in a cross pattern.', viewingTips: 'Completes the Auriga cluster trio. Note the cross-shaped pattern.' },
  { name: 'M79', type: 'star_cluster', constellation: 'Lepus', magnitude: '8.6', difficulty: 'moderate', description: 'A globular cluster unusually located far from the galactic center.', viewingTips: 'One of the few globular clusters visible in winter skies.' },
  { name: 'NGC 2237', commonName: 'Rosette Nebula', type: 'nebula', constellation: 'Monoceros', magnitude: '9.0', difficulty: 'challenging', description: 'A large circular emission nebula surrounding the star cluster NGC 2244.', viewingTips: 'Use a wide-field eyepiece and UHC/OIII filter if available. The cluster is easy; the nebula is the challenge.' },
  { name: 'M78', type: 'nebula', constellation: 'Orion', magnitude: '8.3', difficulty: 'moderate', description: 'A reflection nebula northeast of Orion\'s Belt.', viewingTips: 'Look for a comet-like glow with two embedded stars.' },
  { name: 'NGC 2392', commonName: 'Eskimo Nebula', type: 'nebula', constellation: 'Gemini', magnitude: '9.2', difficulty: 'moderate', description: 'A planetary nebula with a bright central star surrounded by a fuzzy halo.', viewingTips: 'Use high magnification. Looks like a fuzzy star at low power.' },
  { name: 'M41', type: 'star_cluster', constellation: 'Canis Major', magnitude: '4.5', difficulty: 'easy', description: 'A bright open cluster just south of Sirius.', viewingTips: 'Easy to find below Sirius. Contains a distinctive orange star near center.' },
  { name: 'M46', type: 'star_cluster', constellation: 'Puppis', magnitude: '6.1', difficulty: 'easy', description: 'A rich open cluster with a planetary nebula (NGC 2438) superimposed.', viewingTips: 'See if you can spot the tiny ring of NGC 2438 within the cluster.' },
  { name: 'M47', type: 'star_cluster', constellation: 'Puppis', magnitude: '4.2', difficulty: 'easy', description: 'A bright, sparse open cluster near M46.', viewingTips: 'Observe with M46 for a great contrast - bright/sparse vs. faint/rich.' },
  { name: 'M48', type: 'star_cluster', constellation: 'Hydra', magnitude: '5.5', difficulty: 'easy', description: 'A large open cluster best seen in binoculars or wide field.', viewingTips: 'Looks triangular. Use low power for the best view.' },
  { name: 'NGC 457', commonName: 'Owl Cluster', type: 'star_cluster', constellation: 'Cassiopeia', magnitude: '6.4', difficulty: 'easy', description: 'An open cluster resembling an owl (or E.T.) with two bright "eyes".', viewingTips: 'The two brightest stars form the eyes. A favorite at star parties.' },
];

const springObjects: TLTOObject[] = [
  { name: 'M81', commonName: 'Bode\'s Galaxy', type: 'galaxy', constellation: 'Ursa Major', magnitude: '6.9', difficulty: 'moderate', description: 'A grand design spiral galaxy, one of the brightest galaxies in the sky.', viewingTips: 'Best with M82 in the same field of view. Look for the bright core.' },
  { name: 'M82', commonName: 'Cigar Galaxy', type: 'galaxy', constellation: 'Ursa Major', magnitude: '8.4', difficulty: 'moderate', description: 'A starburst galaxy with a distinctive edge-on elongated shape.', viewingTips: 'Note the cigar shape and mottled texture compared to M81.' },
  { name: 'M51', commonName: 'Whirlpool Galaxy', type: 'galaxy', constellation: 'Canes Venatici', magnitude: '8.4', difficulty: 'moderate', description: 'A face-on spiral galaxy interacting with companion NGC 5195.', viewingTips: 'With good conditions and averted vision, you may glimpse spiral arms.' },
  { name: 'M101', commonName: 'Pinwheel Galaxy', type: 'galaxy', constellation: 'Ursa Major', magnitude: '7.9', difficulty: 'challenging', description: 'A large face-on spiral galaxy with low surface brightness.', viewingTips: 'Needs dark skies. Use low power and averted vision. Very spread out.' },
  { name: 'M104', commonName: 'Sombrero Galaxy', type: 'galaxy', constellation: 'Virgo', magnitude: '8.0', difficulty: 'moderate', description: 'A nearly edge-on galaxy with a prominent dust lane and bright nucleus.', viewingTips: 'Look for the dark dust lane cutting across the bright center.' },
  { name: 'M65', type: 'galaxy', constellation: 'Leo', magnitude: '10.3', difficulty: 'moderate', description: 'Part of the Leo Triplet with M66 and NGC 3628.', viewingTips: 'View all three in the same field for a spectacular galaxy group.' },
  { name: 'M66', type: 'galaxy', constellation: 'Leo', magnitude: '9.7', difficulty: 'moderate', description: 'The brightest member of the Leo Triplet.', viewingTips: 'Note the slightly asymmetric shape from gravitational interaction.' },
  { name: 'M44', commonName: 'Beehive Cluster', type: 'star_cluster', constellation: 'Cancer', magnitude: '3.7', difficulty: 'easy', description: 'A large open cluster visible to the naked eye in dark skies.', viewingTips: 'Best in binoculars. Too large for most telescope fields of view.' },
  { name: 'M67', type: 'star_cluster', constellation: 'Cancer', magnitude: '6.1', difficulty: 'easy', description: 'One of the oldest known open clusters, about 4 billion years old.', viewingTips: 'Compact and rich. Compare to the younger, sparser M44.' },
  { name: 'M3', type: 'star_cluster', constellation: 'Canes Venatici', magnitude: '6.2', difficulty: 'easy', description: 'A brilliant globular cluster, one of the finest in the northern sky.', viewingTips: 'Try higher magnification to resolve individual stars at the edges.' },
  { name: 'M53', type: 'star_cluster', constellation: 'Coma Berenices', magnitude: '7.6', difficulty: 'moderate', description: 'A globular cluster in Coma Berenices.', viewingTips: 'Fairly compact. Pair with nearby NGC 5053 for contrast.' },
  { name: 'NGC 4565', commonName: 'Needle Galaxy', type: 'galaxy', constellation: 'Coma Berenices', magnitude: '10.4', difficulty: 'challenging', description: 'A spectacular edge-on spiral galaxy, very thin and elongated.', viewingTips: 'Needs dark skies. Look for the needle-thin streak with a central bulge.' },
  { name: 'M49', type: 'galaxy', constellation: 'Virgo', magnitude: '9.4', difficulty: 'moderate', description: 'The brightest galaxy in the Virgo Cluster.', viewingTips: 'Gateway to the Virgo Cluster. Note the round, featureless glow.' },
  { name: 'M87', commonName: 'Virgo A', type: 'galaxy', constellation: 'Virgo', magnitude: '9.6', difficulty: 'moderate', description: 'A giant elliptical galaxy at the heart of the Virgo Cluster, home to a famous supermassive black hole.', viewingTips: 'Appears as a round glow. Imagine the relativistic jet invisible to our eyes.' },
  { name: 'M84', type: 'galaxy', constellation: 'Virgo', magnitude: '10.1', difficulty: 'moderate', description: 'An elliptical galaxy in Markarian\'s Chain.', viewingTips: 'Part of the famous chain of galaxies. See how many you can hop through.' },
  { name: 'M86', type: 'galaxy', constellation: 'Virgo', magnitude: '9.8', difficulty: 'moderate', description: 'A lenticular galaxy forming a pair with M84 in Markarian\'s Chain.', viewingTips: 'Visible in the same field as M84. The start of Markarian\'s Chain.' },
  { name: 'NGC 3628', commonName: 'Hamburger Galaxy', type: 'galaxy', constellation: 'Leo', magnitude: '10.2', difficulty: 'challenging', description: 'An edge-on spiral galaxy completing the Leo Triplet with M65 and M66.', viewingTips: 'The faintest of the trio. Look for the dark dust lane bisecting it.' },
  { name: 'M94', type: 'galaxy', constellation: 'Canes Venatici', magnitude: '8.2', difficulty: 'moderate', description: 'A compact spiral galaxy with a bright nucleus and ring structure.', viewingTips: 'Note the very bright core surrounded by a fainter outer ring.' },
  { name: 'M106', type: 'galaxy', constellation: 'Canes Venatici', magnitude: '8.4', difficulty: 'moderate', description: 'A spiral galaxy with an active nucleus.', viewingTips: 'One of the brighter spring galaxies. Look for its elongated shape.' },
  { name: 'M64', commonName: 'Black Eye Galaxy', type: 'galaxy', constellation: 'Coma Berenices', magnitude: '9.4', difficulty: 'moderate', description: 'A spiral galaxy with a prominent dark dust band near its nucleus.', viewingTips: 'Higher magnification may reveal the dark "black eye" feature.' },
];

const summerObjects: TLTOObject[] = [
  { name: 'M13', commonName: 'Great Hercules Cluster', type: 'star_cluster', constellation: 'Hercules', magnitude: '5.8', difficulty: 'easy', description: 'The finest globular cluster in the northern sky, containing hundreds of thousands of stars.', viewingTips: 'Use medium-high power to resolve the granular edges into individual stars.' },
  { name: 'M92', type: 'star_cluster', constellation: 'Hercules', magnitude: '6.4', difficulty: 'easy', description: 'A globular cluster overshadowed by M13 but impressive in its own right.', viewingTips: 'Compare to M13 - slightly smaller but very concentrated center.' },
  { name: 'M57', commonName: 'Ring Nebula', type: 'nebula', constellation: 'Lyra', magnitude: '8.8', difficulty: 'moderate', description: 'A planetary nebula - the glowing shell expelled by a dying star.', viewingTips: 'Use medium to high power. Looks like a tiny smoke ring between Beta and Gamma Lyrae.' },
  { name: 'M56', type: 'star_cluster', constellation: 'Lyra', magnitude: '8.3', difficulty: 'moderate', description: 'A compact globular cluster between Lyra and Cygnus.', viewingTips: 'Small but attractive. A good stepping stone between M57 and M29.' },
  { name: 'M27', commonName: 'Dumbbell Nebula', type: 'nebula', constellation: 'Vulpecula', magnitude: '7.5', difficulty: 'easy', description: 'The largest and brightest planetary nebula, with a distinctive dumbbell shape.', viewingTips: 'One of the best planetary nebulae. An OIII filter enhances the view dramatically.' },
  { name: 'M29', type: 'star_cluster', constellation: 'Cygnus', magnitude: '7.1', difficulty: 'easy', description: 'A small open cluster in the rich Cygnus Milky Way.', viewingTips: 'Small but distinctive trapezoid of stars amid the Milky Way.' },
  { name: 'M39', type: 'star_cluster', constellation: 'Cygnus', magnitude: '4.6', difficulty: 'easy', description: 'A loose, bright open cluster best seen in binoculars.', viewingTips: 'Very spread out. Best with lowest magnification or binoculars.' },
  { name: 'M8', commonName: 'Lagoon Nebula', type: 'nebula', constellation: 'Sagittarius', magnitude: '6.0', difficulty: 'easy', description: 'A bright emission nebula with an embedded open cluster.', viewingTips: 'Visible to the naked eye from dark sites. The dark lagoon channel is striking.' },
  { name: 'M20', commonName: 'Trifid Nebula', type: 'nebula', constellation: 'Sagittarius', magnitude: '6.3', difficulty: 'moderate', description: 'A combination of emission, reflection, and dark nebula divided into three lobes.', viewingTips: 'Look for the dark lanes that trisect the nebula. Nearby M8 makes a great pair.' },
  { name: 'M17', commonName: 'Omega Nebula', type: 'nebula', constellation: 'Sagittarius', magnitude: '6.0', difficulty: 'easy', description: 'A bright emission nebula also known as the Swan or Horseshoe Nebula.', viewingTips: 'Look for the distinctive swan or checkmark shape in the brightest part.' },
  { name: 'M16', commonName: 'Eagle Nebula', type: 'nebula', constellation: 'Serpens', magnitude: '6.4', difficulty: 'moderate', description: 'Home of the Pillars of Creation. An emission nebula with an embedded cluster.', viewingTips: 'The cluster is easy; the nebula requires dark skies and possibly a filter.' },
  { name: 'M22', type: 'star_cluster', constellation: 'Sagittarius', magnitude: '5.1', difficulty: 'easy', description: 'One of the nearest and brightest globular clusters.', viewingTips: 'Resolves well into stars. One of the best southern globular clusters visible from mid-northern latitudes.' },
  { name: 'M11', commonName: 'Wild Duck Cluster', type: 'star_cluster', constellation: 'Scutum', magnitude: '6.3', difficulty: 'easy', description: 'One of the richest and most compact open clusters known.', viewingTips: 'Looks almost like a globular cluster at low power. Magnificent star field.' },
  { name: 'M4', type: 'star_cluster', constellation: 'Scorpius', magnitude: '5.6', difficulty: 'easy', description: 'The nearest globular cluster to Earth, with a distinctive bar of stars through its center.', viewingTips: 'Easy to find near Antares. Look for the central bar of stars.' },
  { name: 'M6', commonName: 'Butterfly Cluster', type: 'star_cluster', constellation: 'Scorpius', magnitude: '4.2', difficulty: 'easy', description: 'An open cluster with stars arranged in a butterfly pattern.', viewingTips: 'Note the butterfly wing shape and the orange star BM Scorpii.' },
  { name: 'M7', commonName: 'Ptolemy\'s Cluster', type: 'star_cluster', constellation: 'Scorpius', magnitude: '3.3', difficulty: 'easy', description: 'A large, bright open cluster known since antiquity.', viewingTips: 'Best in binoculars. One of the finest open clusters in the sky.' },
  { name: 'NGC 6960', commonName: 'Veil Nebula (West)', type: 'nebula', constellation: 'Cygnus', magnitude: '7.0', difficulty: 'challenging', description: 'The western arc of the Cygnus Loop supernova remnant.', viewingTips: 'Requires an OIII filter and dark skies. Starts at 52 Cygni.' },
  { name: 'NGC 6992', commonName: 'Veil Nebula (East)', type: 'nebula', constellation: 'Cygnus', magnitude: '7.0', difficulty: 'challenging', description: 'The eastern arc of the Cygnus Loop supernova remnant.', viewingTips: 'Brighter than the western veil. Use an OIII filter for best results.' },
  { name: 'M10', type: 'star_cluster', constellation: 'Ophiuchus', magnitude: '6.6', difficulty: 'easy', description: 'A bright globular cluster in Ophiuchus.', viewingTips: 'Compare with nearby M12 - M10 is more concentrated.' },
  { name: 'M12', type: 'star_cluster', constellation: 'Ophiuchus', magnitude: '7.7', difficulty: 'easy', description: 'A loose globular cluster, almost resembling a dense open cluster.', viewingTips: 'Note how much looser this appears compared to M10.' },
  { name: 'NGC 6826', commonName: 'Blinking Planetary', type: 'nebula', constellation: 'Cygnus', magnitude: '8.8', difficulty: 'moderate', description: 'A planetary nebula that appears to "blink" as you switch between direct and averted vision.', viewingTips: 'Alternate between looking directly at it and using averted vision to see the blinking effect.' },
  { name: 'M5', type: 'star_cluster', constellation: 'Serpens', magnitude: '5.7', difficulty: 'easy', description: 'One of the finest globular clusters, rivaling M13 in beauty.', viewingTips: 'Resolves beautifully at medium power. Note the slightly elongated shape.' },
  { name: 'M80', type: 'star_cluster', constellation: 'Scorpius', magnitude: '7.9', difficulty: 'moderate', description: 'A dense, compact globular cluster between Antares and Beta Scorpii.', viewingTips: 'Very concentrated center. A lovely sight in the rich Scorpius Milky Way.' },
];

const fallObjects: TLTOObject[] = [
  { name: 'M31', commonName: 'Andromeda Galaxy', type: 'galaxy', constellation: 'Andromeda', magnitude: '3.4', difficulty: 'easy', description: 'The nearest major galaxy to the Milky Way, spanning 3 degrees of sky.', viewingTips: 'Use lowest magnification. Look for companion galaxies M32 and M110 nearby.' },
  { name: 'M32', type: 'galaxy', constellation: 'Andromeda', magnitude: '8.1', difficulty: 'moderate', description: 'A compact elliptical satellite galaxy of Andromeda.', viewingTips: 'Appears as a bright fuzzy star near M31\'s nucleus.' },
  { name: 'M110', type: 'galaxy', constellation: 'Andromeda', magnitude: '8.5', difficulty: 'moderate', description: 'A dwarf elliptical satellite galaxy of Andromeda.', viewingTips: 'Larger but dimmer than M32. On the opposite side of M31 from M32.' },
  { name: 'M33', commonName: 'Triangulum Galaxy', type: 'galaxy', constellation: 'Triangulum', magnitude: '5.7', difficulty: 'challenging', description: 'A face-on spiral galaxy with very low surface brightness.', viewingTips: 'Requires dark skies and low power. One of the most distant objects visible to naked eye.' },
  { name: 'M15', type: 'star_cluster', constellation: 'Pegasus', magnitude: '6.2', difficulty: 'easy', description: 'A bright, compact globular cluster with a very dense core.', viewingTips: 'Note the intensely concentrated core. Contains a planetary nebula (Pease 1) for the adventurous.' },
  { name: 'M2', type: 'star_cluster', constellation: 'Aquarius', magnitude: '6.5', difficulty: 'easy', description: 'A rich globular cluster in Aquarius.', viewingTips: 'One of the larger globulars. Resolves nicely at medium magnification.' },
  { name: 'NGC 7331', type: 'galaxy', constellation: 'Pegasus', magnitude: '10.4', difficulty: 'challenging', description: 'A spiral galaxy often considered the Milky Way\'s twin.', viewingTips: 'Nearby lies Stephan\'s Quintet (very faint). A preview of M31 type spirals.' },
  { name: 'NGC 869', commonName: 'Double Cluster (h Per)', type: 'star_cluster', constellation: 'Perseus', magnitude: '5.3', difficulty: 'easy', description: 'Half of the famous Double Cluster, a pair of open clusters visible to the naked eye.', viewingTips: 'Both clusters fit in a wide-field eyepiece. One of the sky\'s finest sights.' },
  { name: 'NGC 884', commonName: 'Double Cluster (Chi Per)', type: 'star_cluster', constellation: 'Perseus', magnitude: '6.1', difficulty: 'easy', description: 'The second half of the Double Cluster.', viewingTips: 'Note the red supergiant stars scattered through Chi Persei.' },
  { name: 'M52', type: 'star_cluster', constellation: 'Cassiopeia', magnitude: '5.0', difficulty: 'easy', description: 'A rich open cluster in Cassiopeia.', viewingTips: 'Fan-shaped cluster. Nearby is the Bubble Nebula (NGC 7635) for a challenge.' },
  { name: 'M103', type: 'star_cluster', constellation: 'Cassiopeia', magnitude: '7.4', difficulty: 'easy', description: 'A small open cluster forming a triangle pattern near Delta Cassiopeiae.', viewingTips: 'Easy to find near the end of the Cassiopeia "W". Contains a red giant star.' },
  { name: 'NGC 7009', commonName: 'Saturn Nebula', type: 'nebula', constellation: 'Aquarius', magnitude: '8.0', difficulty: 'moderate', description: 'A bright planetary nebula resembling the planet Saturn with ansae.', viewingTips: 'Use high magnification. The Saturn-like extensions are visible in larger scopes.' },
  { name: 'NGC 7293', commonName: 'Helix Nebula', type: 'nebula', constellation: 'Aquarius', magnitude: '7.6', difficulty: 'challenging', description: 'The nearest planetary nebula to Earth, large but with low surface brightness.', viewingTips: 'Very large and diffuse. Needs dark skies and low power. An OIII filter helps enormously.' },
  { name: 'M74', type: 'galaxy', constellation: 'Pisces', magnitude: '10.0', difficulty: 'challenging', description: 'A face-on spiral galaxy with very low surface brightness.', viewingTips: 'One of the hardest Messier objects. Requires excellent skies and patience.' },
  { name: 'M76', commonName: 'Little Dumbbell Nebula', type: 'nebula', constellation: 'Perseus', magnitude: '10.1', difficulty: 'challenging', description: 'A small planetary nebula resembling a miniature M27.', viewingTips: 'Small but visible in moderate aperture. Use higher magnification.' },
  { name: 'M34', type: 'star_cluster', constellation: 'Perseus', magnitude: '5.5', difficulty: 'easy', description: 'A scattered open cluster easily seen in binoculars.', viewingTips: 'Contains several nice double stars. Best at low to medium power.' },
  { name: 'NGC 253', commonName: 'Sculptor Galaxy', type: 'galaxy', constellation: 'Sculptor', magnitude: '8.0', difficulty: 'moderate', description: 'A large, bright edge-on spiral galaxy also called the Silver Dollar Galaxy.', viewingTips: 'Low on the southern horizon for northern observers. Mottled texture visible in larger scopes.' },
  { name: 'M77', type: 'galaxy', constellation: 'Cetus', magnitude: '9.6', difficulty: 'moderate', description: 'A Seyfert galaxy with an active nucleus.', viewingTips: 'Appears as a bright compact core with a faint halo. Brightest Seyfert galaxy.' },
  { name: 'NGC 246', commonName: 'Skull Nebula', type: 'nebula', constellation: 'Cetus', magnitude: '11.0', difficulty: 'challenging', description: 'A large, faint planetary nebula with a distinctive mottled appearance.', viewingTips: 'Requires dark skies. Use an OIII filter and low magnification.' },
];

const allSeasons: Record<Season, TLTOObject[]> = {
  winter: winterObjects,
  spring: springObjects,
  summer: summerObjects,
  fall: fallObjects,
};

/**
 * Get seasonal objects for a given month.
 * Transition months (March, June, September, December) get objects from both adjacent seasons.
 */
export function getSeasonalObjects(month: string): TLTOObject[] {
  // Check for transition month overlap
  const overlapSeasons = transitionOverlap[month];
  if (overlapSeasons) {
    const combined: TLTOObject[] = [];
    const seen = new Set<string>();
    for (const season of overlapSeasons) {
      for (const obj of allSeasons[season]) {
        if (!seen.has(obj.name)) {
          seen.add(obj.name);
          combined.push(obj);
        }
      }
    }
    return combined;
  }

  // Find which season this month belongs to
  for (const [season, months] of Object.entries(seasonMonths)) {
    if (months.includes(month)) {
      return allSeasons[season as Season];
    }
  }

  // Fallback: return all objects
  return [...winterObjects, ...springObjects, ...summerObjects, ...fallObjects];
}

/**
 * Get all objects across all seasons (deduped by name)
 */
export function getAllObjects(): TLTOObject[] {
  const all: TLTOObject[] = [];
  const seen = new Set<string>();
  for (const objects of Object.values(allSeasons)) {
    for (const obj of objects) {
      if (!seen.has(obj.name)) {
        seen.add(obj.name);
        all.push(obj);
      }
    }
  }
  return all;
}
