/**
 * 2MASS Messier Catalog Image Data
 *
 * Source: https://www.ipac.caltech.edu/2mass/gallery/messiercat.html
 *
 * Attribution (required for use):
 * Atlas Image [or Atlas Image mosaic] obtained as part of the Two Micron All Sky Survey (2MASS),
 * a joint project of the University of Massachusetts and the Infrared Processing and Analysis
 * Center/California Institute of Technology, funded by the National Aeronautics and Space
 * Administration and the National Science Foundation.
 */

export const TWOMASS_ATTRIBUTION =
  "Atlas Image obtained as part of the Two Micron All Sky Survey (2MASS), " +
  "a joint project of the University of Massachusetts and the Infrared Processing and Analysis " +
  "Center/California Institute of Technology, funded by the National Aeronautics and Space " +
  "Administration and the National Science Foundation.";

export const TWOMASS_BASE_URL = "https://www.ipac.caltech.edu/2mass/gallery/";

/**
 * Mapping of Messier catalog numbers to 2MASS atlas image filenames
 */
export const MESSIER_2MASS_IMAGES: Record<string, string> = {
  "M1": "crabatlas.jpg",
  "M2": "m2atlas.jpg",
  "M3": "m3atlas.jpg",
  "M4": "m4atlas.jpg",
  "M5": "m5atlas.jpg",
  "M6": "m6atlas.jpg",
  "M7": "m7atlas.jpg",
  "M8": "m8atlas.jpg",
  "M9": "m9atlas.jpg",
  "M10": "m10atlas.jpg",
  "M11": "m11atlas.jpg",
  "M12": "m12atlas.jpg",
  "M13": "m13atlas.jpg",
  "M14": "m14atlas.jpg",
  "M15": "m15atlas.jpg",
  "M16": "m16atlas.jpg",
  "M17": "m17atlas.jpg",
  "M18": "m18atlas.jpg",
  "M19": "m19atlas.jpg",
  "M20": "m20atlas.jpg",
  "M21": "m21atlas.jpg",
  "M22": "m22atlas.jpg",
  "M23": "m23atlas.jpg",
  "M24": "m24atlas.jpg",
  "M25": "m25atlas.jpg",
  "M26": "m26atlas.jpg",
  "M27": "dumbbellatlas.jpg",
  "M28": "m28atlas.jpg",
  "M29": "m29atlas.jpg",
  "M30": "m30atlas.jpg",
  "M31": "m31atlas.jpg",
  "M32": "m32atlas.jpg",
  "M33": "m33atlas.jpg",
  "M34": "m34atlas.jpg",
  "M35": "m35atlas.jpg",
  "M36": "m36atlas.jpg",
  "M37": "m37atlas.jpg",
  "M38": "m38atlas.jpg",
  "M39": "m39atlas.jpg",
  "M40": "m40atlas.jpg",
  "M41": "m41atlas.jpg",
  "M42": "orionatlas.jpg",
  "M43": "orionatlas.jpg", // M42 and M43 share the same image (Orion Nebula complex)
  "M44": "praesepeatlas.jpg",
  "M45": "pleiadesatlas.jpg",
  "M46": "m46atlas.jpg",
  "M47": "m47atlas.jpg",
  "M48": "m48atlas.jpg",
  "M49": "m49atlas.jpg",
  "M50": "m50atlas.jpg",
  "M51": "m51atlas.jpg",
  "M52": "m52atlas.jpg",
  "M53": "m53atlas.jpg",
  "M54": "m54atlas.jpg",
  "M55": "m55atlas.jpg",
  "M56": "m56atlas.jpg",
  "M57": "ringatlas.jpg",
  "M58": "m58atlas.jpg",
  "M59": "m59atlas.jpg",
  "M60": "m60atlas.jpg",
  "M61": "m61atlas.jpg",
  "M62": "m62atlas.jpg",
  "M63": "m63atlas.jpg",
  "M64": "m64atlas.jpg",
  "M65": "m65atlas.jpg",
  "M66": "m66atlas.jpg",
  "M67": "spr99/m67atlas.jpg",
  "M68": "m68atlas.jpg",
  "M69": "m69atlas.jpg",
  "M70": "m70atlas.jpg",
  "M71": "spr99/m71atlas.jpg",
  "M72": "m72atlas.jpg",
  "M73": "m73atlas.jpg",
  "M74": "m74atlas.jpg",
  "M75": "m75atlas.jpg",
  "M76": "m76atlas.jpg",
  "M77": "ngc1068atlas.jpg",
  "M78": "m78atlas.jpg",
  "M79": "m79atlas.jpg",
  "M80": "m80atlas.jpg",
  "M81": "m81atlas.jpg",
  "M82": "m82atlas.jpg",
  "M83": "m83atlas.jpg",
  "M84": "m84atlas.jpg",
  "M85": "m85atlas.jpg",
  "M86": "m86atlas.jpg",
  "M87": "m87atlas.jpg",
  "M88": "m88atlas.jpg",
  "M89": "m89atlas.jpg",
  "M90": "m90atlas.jpg",
  "M91": "m91atlas.jpg",
  "M92": "m92atlas.jpg",
  "M93": "m93atlas.jpg",
  "M94": "m94atlas.jpg",
  "M95": "m95atlas.jpg",
  "M96": "m96atlas.jpg",
  "M97": "m97atlas.jpg",
  "M98": "m98atlas.jpg",
  "M99": "m99atlas.jpg",
  "M100": "spr99/m100atlas.jpg",
  "M101": "m101atlas.jpg",
  "M102": "m102atlas.jpg",
  "M103": "m103atlas.jpg",
  "M104": "m104atlas.jpg",
  "M105": "m105atlas.jpg",
  "M106": "m106atlas.jpg",
  "M107": "m107atlas.jpg",
  "M108": "m108atlas.jpg",
  "M109": "m109atlas.jpg",
  "M110": "ngc205atlas.jpg",
};

/**
 * Get the full 2MASS image URL for a Messier object
 * @param messierNumber - The Messier catalog number (e.g., "M31", "M42")
 * @returns The full URL to the 2MASS atlas image, or null if not found
 */
export function get2MASSImageUrl(messierNumber: string): string | null {
  const normalized = messierNumber.toUpperCase().replace(/\s+/g, '');
  const filename = MESSIER_2MASS_IMAGES[normalized];
  if (filename) {
    return `${TWOMASS_BASE_URL}${filename}`;
  }
  return null;
}

/**
 * Extract Messier number from an object name
 * @param name - Object name like "Andromeda Galaxy (M31)" or "M42 - Orion Nebula"
 * @returns The Messier number (e.g., "M31") or null if not a Messier object
 */
export function extractMessierNumber(name: string): string | null {
  // Match patterns like "M31", "(M31)", "M 31", etc.
  const match = name.match(/\bM\s*(\d{1,3})\b/i);
  if (match) {
    return `M${match[1]}`;
  }
  return null;
}

/**
 * Check if an object is a Messier catalog object
 */
export function isMessierObject(name: string): boolean {
  return extractMessierNumber(name) !== null;
}
