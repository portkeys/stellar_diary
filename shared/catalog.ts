/**
 * Catalog designation helpers shared by client and server.
 *
 * Objects are stored with descriptive names like "Great Pegasus Cluster (M15)",
 * but guide sources often refer to them by bare designation ("M15"). Matching on
 * the designation prevents the same object being inserted twice.
 */

const DESIGNATION_RE = /\b(M|NGC|IC|C)\s*(\d{1,4})\b/gi;

/** Normalized catalog designations found in a name, e.g. ["M65", "M66", "NGC3628"] */
export function extractCatalogIds(name: string): string[] {
  const ids: string[] = [];
  let m: RegExpExecArray | null;
  DESIGNATION_RE.lastIndex = 0;
  while ((m = DESIGNATION_RE.exec(name)) !== null) {
    ids.push(`${m[1].toUpperCase()}${parseInt(m[2], 10)}`);
  }
  return ids;
}

/** Messier number from a name like "Crab Nebula (M1)" or "M42", or null */
export function extractMessierNumber(name: string): number | null {
  const id = extractCatalogIds(name).find((d) => d.startsWith("M"));
  return id ? parseInt(id.slice(1), 10) : null;
}

/**
 * Find an existing object matching `name`, by exact (case-insensitive) name first,
 * then by primary catalog designation (the first one in the name, so
 * "M66" does not collapse into "Leo Triplet (M65, M66, NGC 3628)").
 */
export function findMatchingObject<T extends { name: string }>(name: string, objects: T[]): T | undefined {
  const lower = name.trim().toLowerCase();
  const exact = objects.find((o) => o.name.toLowerCase() === lower);
  if (exact) return exact;
  const ids = extractCatalogIds(name);
  if (ids.length === 0) return undefined;
  return objects.find((o) => extractCatalogIds(o.name)[0] === ids[0]);
}
