/**
 * Sky Event Checker
 *
 * Automated status checks for anticipated sky events (e.g. the T CrB nova):
 * 1. AAVSO WebObs — latest visual-band magnitude for the watched star.
 *    A nova is detected when the star brightens past the event's trigger magnitude.
 * 2. Google News RSS — latest headline for the event's news query (no API key needed).
 */

import type { SkyEvent } from '@shared/schema';

export interface AavsoMagnitude {
  magnitude: number;
  band: string;
  date: string; // calendar date string from AAVSO, e.g. "2026 Jul. 02.40855"
}

export interface NewsHeadline {
  title: string;
  url: string;
  pubDate: string;
}

export interface SkyEventCheckResult {
  currentMagnitude?: number;
  magnitudeBand?: string;
  status?: string;
  triggeredAt?: Date;
  latestNewsTitle?: string;
  latestNewsUrl?: string;
  latestNewsDate?: string;
  lastCheckedAt: Date;
}

/**
 * Fetch the most recent visual-band (V or Vis.) magnitude for a star from AAVSO WebObs.
 * Rows come back most-recent-first; we take the first parseable V/Vis. measurement.
 */
export async function fetchAavsoVisualMagnitude(starName: string): Promise<AavsoMagnitude | null> {
  const url = `https://apps.aavso.org/webobs/results/?star=${encodeURIComponent(starName)}&num_results=25`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StellarDiary/1.0)' },
  });
  if (!response.ok) return null;
  const html = await response.text();

  const target = starName.replace(/\s+/g, ' ').trim().toUpperCase();
  for (const row of html.split(/<tr[^>]*>/i)) {
    const cells = Array.from(row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)).map((m) =>
      m[1].replace(/<[^>]+>/g, '').replace(/&mdash;/g, '—').trim()
    );
    // Observation rows: [ '', star, JD, calendar date, magnitude, error, filter, observer, ... ]
    if (cells.length < 8) continue;
    if (cells[1]?.toUpperCase() !== target) continue;
    const magnitude = parseFloat(cells[4]);
    const band = cells[6];
    if (!Number.isFinite(magnitude)) continue;
    if (band === 'V' || band === 'Vis.') {
      return { magnitude, band, date: cells[3] };
    }
  }
  return null;
}

/**
 * Fetch the newest headline from Google News RSS for a search query.
 */
export async function fetchLatestNews(query: string): Promise<NewsHeadline | null> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StellarDiary/1.0)' },
  });
  if (!response.ok) return null;
  const xml = await response.text();

  const items = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g)).map((m) => m[1]);
  let newest: NewsHeadline | null = null;
  for (const item of items.slice(0, 10)) {
    const title = item
      .match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1]
      ?.trim();
    const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim();
    const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim();
    if (!title || !link || !pubDate) continue;
    const time = Date.parse(pubDate);
    if (!Number.isFinite(time)) continue;
    if (!newest || time > Date.parse(newest.pubDate)) {
      newest = { title, url: link, pubDate };
    }
  }
  return newest;
}

/**
 * Run all applicable checks for one event and return the field updates to persist.
 * Never throws — a failed source just leaves its fields unchanged.
 */
export async function runSkyEventCheck(event: SkyEvent): Promise<SkyEventCheckResult> {
  const updates: SkyEventCheckResult = { lastCheckedAt: new Date() };

  if (event.aavsoName) {
    try {
      const reading = await fetchAavsoVisualMagnitude(event.aavsoName);
      if (reading) {
        updates.currentMagnitude = reading.magnitude;
        updates.magnitudeBand = reading.band;
        if (
          event.status === 'waiting' &&
          event.triggerMagnitude != null &&
          reading.magnitude <= event.triggerMagnitude
        ) {
          updates.status = 'triggered';
          updates.triggeredAt = new Date();
        }
      }
    } catch (error) {
      console.error(`AAVSO check failed for ${event.name}:`, error);
    }
  }

  if (event.newsQuery) {
    try {
      const news = await fetchLatestNews(event.newsQuery);
      if (news) {
        updates.latestNewsTitle = news.title;
        updates.latestNewsUrl = news.url;
        updates.latestNewsDate = news.pubDate;
      }
    } catch (error) {
      console.error(`News check failed for ${event.name}:`, error);
    }
  }

  return updates;
}
