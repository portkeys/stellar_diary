var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  apodCache: () => apodCache,
  celestialObjectTypes: () => celestialObjectTypes,
  celestialObjects: () => celestialObjects,
  insertApodCacheSchema: () => insertApodCacheSchema,
  insertCelestialObjectSchema: () => insertCelestialObjectSchema,
  insertMonthlyGuideSchema: () => insertMonthlyGuideSchema,
  insertObservationSchema: () => insertObservationSchema,
  insertTelescopeTipSchema: () => insertTelescopeTipSchema,
  insertUserSchema: () => insertUserSchema,
  monthlyGuides: () => monthlyGuides,
  observations: () => observations,
  telescopeTips: () => telescopeTips,
  users: () => users
});
import { pgTable, text, serial, integer, boolean, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users, insertUserSchema, celestialObjectTypes, celestialObjects, insertCelestialObjectSchema, observations, insertObservationSchema, monthlyGuides, insertMonthlyGuideSchema, telescopeTips, insertTelescopeTipSchema, apodCache, insertApodCacheSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    users = pgTable("users", {
      id: serial("id").primaryKey(),
      username: text("username").notNull().unique(),
      password: text("password").notNull()
    });
    insertUserSchema = createInsertSchema(users).pick({
      username: true,
      password: true
    });
    celestialObjectTypes = ["planet", "galaxy", "nebula", "star_cluster", "double_star", "moon", "other"];
    celestialObjects = pgTable("celestial_objects", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      type: text("type").notNull(),
      description: text("description").notNull(),
      coordinates: text("coordinates").notNull(),
      // RA and Dec in format: "RAh RAm RAs | Dec° Dec′ Dec″"
      bestViewingTime: text("best_viewing_time"),
      // Time range or specific month
      imageUrl: text("image_url"),
      // URL to image
      visibilityRating: text("visibility_rating"),
      // Poor, Good, Excellent
      information: text("information"),
      // Additional object info
      constellation: text("constellation"),
      // Constellation it belongs to
      magnitude: text("magnitude"),
      // Visual magnitude
      hemisphere: text("hemisphere"),
      // Northern, Southern, Both
      recommendedEyepiece: text("recommended_eyepiece"),
      // Suggestions for viewing
      month: text("month")
      // Month when it's best to observe
    });
    insertCelestialObjectSchema = createInsertSchema(celestialObjects).omit({
      id: true
    });
    observations = pgTable("observations", {
      id: serial("id").primaryKey(),
      userId: integer("user_id"),
      // Not enforcing foreign key in memory storage
      objectId: integer("object_id"),
      // Not enforcing foreign key in memory storage
      isObserved: boolean("is_observed").default(false),
      observationNotes: text("observation_notes"),
      dateAdded: timestamp("date_added").defaultNow(),
      plannedDate: date("planned_date")
    });
    insertObservationSchema = createInsertSchema(observations).omit({
      id: true,
      dateAdded: true
    }).transform((data) => {
      if (!data.plannedDate) {
        data.plannedDate = null;
      }
      return data;
    });
    monthlyGuides = pgTable("monthly_guides", {
      id: serial("id").primaryKey(),
      month: text("month").notNull(),
      // January, February, etc.
      year: integer("year").notNull(),
      headline: text("headline").notNull(),
      description: text("description").notNull(),
      hemisphere: text("hemisphere").notNull(),
      // Northern, Southern, Both
      videoUrls: text("video_urls").array(),
      // Array of YouTube video URLs
      isAdmin: boolean("is_admin").default(false)
      // Flag to identify if content is only for admin view
    });
    insertMonthlyGuideSchema = createInsertSchema(monthlyGuides).omit({
      id: true
    });
    telescopeTips = pgTable("telescope_tips", {
      id: serial("id").primaryKey(),
      title: text("title").notNull(),
      content: text("content").notNull(),
      category: text("category").notNull(),
      // Collimation, Eyepieces, Maintenance, etc.
      imageUrl: text("image_url")
    });
    insertTelescopeTipSchema = createInsertSchema(telescopeTips).omit({
      id: true
    });
    apodCache = pgTable("apod_cache", {
      id: serial("id").primaryKey(),
      date: text("date").notNull(),
      title: text("title").notNull(),
      explanation: text("explanation").notNull(),
      url: text("url").notNull(),
      hdurl: text("hdurl"),
      media_type: text("media_type").notNull(),
      copyright: text("copyright"),
      service_version: text("service_version"),
      cached_at: timestamp("cached_at").defaultNow().notNull()
    });
    insertApodCacheSchema = createInsertSchema(apodCache).omit({
      id: true,
      cached_at: true
    });
  }
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
var pool, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    neonConfig.webSocketConstructor = ws;
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
      );
    }
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema: schema_exports });
  }
});

// server/storage.ts
import { eq, and, or } from "drizzle-orm";
var DatabaseStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_schema();
    init_db();
    DatabaseStorage = class {
      async getUser(id) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user || void 0;
      }
      async getUserByUsername(username) {
        const [user] = await db.select().from(users).where(eq(users.username, username));
        return user || void 0;
      }
      async createUser(insertUser) {
        const [user] = await db.insert(users).values(insertUser).returning();
        return user;
      }
      async getCelestialObject(id) {
        const [object] = await db.select().from(celestialObjects).where(eq(celestialObjects.id, id));
        return object || void 0;
      }
      async getCelestialObjectByName(name) {
        const [object] = await db.select().from(celestialObjects).where(eq(celestialObjects.name, name));
        return object || void 0;
      }
      async getAllCelestialObjects() {
        return await db.select().from(celestialObjects);
      }
      async getCelestialObjectsByType(type) {
        return await db.select().from(celestialObjects).where(eq(celestialObjects.type, type));
      }
      async getCelestialObjectsByMonth(month) {
        return await db.select().from(celestialObjects).where(eq(celestialObjects.month, month));
      }
      async getCelestialObjectsByHemisphere(hemisphere) {
        if (hemisphere === "both") {
          return await db.select().from(celestialObjects);
        } else {
          return await db.select().from(celestialObjects).where(
            or(
              eq(celestialObjects.hemisphere, hemisphere),
              eq(celestialObjects.hemisphere, "both")
            )
          );
        }
      }
      async createCelestialObject(insertObject) {
        const [object] = await db.insert(celestialObjects).values(insertObject).returning();
        return object;
      }
      async deleteCelestialObject(id) {
        const [deleted] = await db.delete(celestialObjects).where(eq(celestialObjects.id, id)).returning();
        return !!deleted;
      }
      async getObservation(id) {
        const [observation] = await db.select().from(observations).where(eq(observations.id, id));
        return observation || void 0;
      }
      async getUserObservations(userId) {
        return await db.select().from(observations).where(eq(observations.userId, userId));
      }
      async createObservation(insertObservation) {
        const [observation] = await db.insert(observations).values(insertObservation).returning();
        return observation;
      }
      async updateObservation(id, update) {
        const [updatedObservation] = await db.update(observations).set(update).where(eq(observations.id, id)).returning();
        return updatedObservation || void 0;
      }
      async deleteObservation(id) {
        const [deleted] = await db.delete(observations).where(eq(observations.id, id)).returning();
        return !!deleted;
      }
      async getMonthlyGuide(id) {
        const [guide] = await db.select().from(monthlyGuides).where(eq(monthlyGuides.id, id));
        return guide || void 0;
      }
      async getCurrentMonthlyGuide(hemisphere) {
        const currentMonth = (/* @__PURE__ */ new Date()).toLocaleString("default", { month: "long" });
        const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
        const [guide] = await db.select().from(monthlyGuides).where(
          and(
            eq(monthlyGuides.month, currentMonth),
            eq(monthlyGuides.year, currentYear),
            or(
              eq(monthlyGuides.hemisphere, hemisphere),
              eq(monthlyGuides.hemisphere, "both")
            )
          )
        );
        return guide || void 0;
      }
      async getAllMonthlyGuides() {
        return await db.select().from(monthlyGuides);
      }
      async createMonthlyGuide(insertGuide) {
        const [guide] = await db.insert(monthlyGuides).values(insertGuide).returning();
        return guide;
      }
      async updateMonthlyGuide(id, update) {
        const [updatedGuide] = await db.update(monthlyGuides).set(update).where(eq(monthlyGuides.id, id)).returning();
        return updatedGuide || void 0;
      }
      async getTelescopeTip(id) {
        const [tip] = await db.select().from(telescopeTips).where(eq(telescopeTips.id, id));
        return tip || void 0;
      }
      async getAllTelescopeTips() {
        return await db.select().from(telescopeTips);
      }
      async getTelescopeTipsByCategory(category) {
        return await db.select().from(telescopeTips).where(eq(telescopeTips.category, category));
      }
      async createTelescopeTip(insertTip) {
        const [tip] = await db.insert(telescopeTips).values(insertTip).returning();
        return tip;
      }
    };
    storage = new DatabaseStorage();
  }
});

// server/services/nasaImagesNode.ts
async function makeApiRequest(url, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "StellarDiary/1.0 (+https://stellar-diary.vercel.app)"
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1e3));
      }
    }
  }
  console.error(`All ${maxRetries} attempts failed`);
  return null;
}
async function searchNasaImagesData(query, size = 3) {
  const params = new URLSearchParams({
    q: query,
    media_type: "image",
    page: "1",
    page_size: size.toString()
  });
  const url = `https://images-api.nasa.gov/search?${params.toString()}`;
  return makeApiRequest(url);
}
async function extractBestImageUrl(apiResponse) {
  try {
    const items = apiResponse.collection?.items;
    if (!items || items.length === 0) {
      return null;
    }
    const firstItem = items[0];
    const nasaId = firstItem.data?.[0]?.nasa_id;
    if (!nasaId) {
      const previewLink = firstItem.links?.find((link) => link.rel === "preview");
      return previewLink?.href || null;
    }
    const assetUrl = `https://images-api.nasa.gov/asset/${nasaId}`;
    const assetResponse = await makeApiRequest(assetUrl);
    if (!assetResponse) {
      const previewLink = firstItem.links?.find((link) => link.rel === "preview");
      return previewLink?.href || null;
    }
    const assetItems = assetResponse.collection?.items || [];
    let bestUrl = null;
    for (const item of assetItems) {
      const href = item.href;
      if (href.endsWith(".jpg") || href.endsWith(".jpeg") || href.endsWith(".png")) {
        if (href.toLowerCase().includes("large") || href.includes("1024") || href.includes("2048")) {
          bestUrl = href;
          break;
        } else if (!bestUrl) {
          bestUrl = href;
        }
      }
    }
    return bestUrl;
  } catch (error) {
    console.error("Error extracting image URL:", error);
    return null;
  }
}
async function searchWikipediaImage(objectName) {
  try {
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      prop: "pageimages",
      piprop: "thumbnail",
      pithumbsize: "800",
      titles: objectName,
      redirects: "1",
      origin: "*"
      // Required for CORS
    });
    const url = `https://en.wikipedia.org/w/api.php?${params.toString()}`;
    const response = await makeApiRequest(url);
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
async function searchCelestialObjectImage(objectName) {
  try {
    console.log(`Searching for image (NASA/Wikipedia) for: ${objectName}`);
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
          source: "nasa",
          metadata: {
            title: data?.title || "",
            description: data?.description || "",
            date_created: data?.date_created || "",
            center: data?.center || "",
            nasa_id: data?.nasa_id || ""
          }
        };
      }
    }
    console.log(`NASA search failed for ${objectName}, trying Wikipedia...`);
    const wikiResult = await searchWikipediaImage(objectName);
    if (wikiResult.success && wikiResult.image_url) {
      return {
        success: true,
        object_name: objectName,
        image_url: wikiResult.image_url,
        source: "wikipedia",
        metadata: {
          title: wikiResult.title,
          description: "",
          date_created: "",
          center: "",
          nasa_id: ""
        }
      };
    }
    return {
      success: false,
      object_name: objectName,
      image_url: null,
      error: "No suitable image found in NASA or Wikipedia database"
    };
  } catch (error) {
    console.error(`Error searching for image for ${objectName}:`, error);
    return {
      success: false,
      object_name: objectName,
      image_url: null,
      error: `Failed to search for image: ${error instanceof Error ? error.message : "Unknown error"}`
    };
  }
}
async function previewCelestialObjectImageSearch(objectName) {
  return searchCelestialObjectImage(objectName);
}
var init_nasaImagesNode = __esm({
  "server/services/nasaImagesNode.ts"() {
    "use strict";
  }
});

// server/services/nasaImages.ts
var nasaImages_exports = {};
__export(nasaImages_exports, {
  previewCelestialObjectImageSearch: () => previewCelestialObjectImageSearch2,
  searchCelestialObjectImage: () => searchCelestialObjectImage2,
  updateAllCelestialObjectImages: () => updateAllCelestialObjectImages,
  updateCelestialObjectImage: () => updateCelestialObjectImage
});
import { eq as eq3 } from "drizzle-orm";
async function searchCelestialObjectImage2(objectName) {
  return searchCelestialObjectImage(objectName);
}
async function previewCelestialObjectImageSearch2(objectName) {
  return previewCelestialObjectImageSearch(objectName);
}
async function updateCelestialObjectImage(objectId) {
  try {
    const celestialObject = await db.select().from(celestialObjects).where(eq3(celestialObjects.id, objectId));
    if (celestialObject.length === 0) {
      return {
        success: false,
        message: `Celestial object with ID ${objectId} not found`
      };
    }
    const object = celestialObject[0];
    const objectName = object.name;
    const searchResult = await searchCelestialObjectImage2(objectName);
    if (!searchResult.success || !searchResult.image_url) {
      return {
        success: false,
        message: `No image found for ${objectName}: ${searchResult.error || "Unknown error"}`,
        objectName
      };
    }
    await db.update(celestialObjects).set({ imageUrl: searchResult.image_url }).where(eq3(celestialObjects.id, objectId));
    console.log(`\u2713 Updated image for ${objectName}: ${searchResult.image_url}`);
    return {
      success: true,
      message: `Successfully updated image for ${objectName}`,
      objectName,
      newImageUrl: searchResult.image_url
    };
  } catch (error) {
    console.error(`Error updating celestial object image:`, error);
    return {
      success: false,
      message: `Failed to update image: ${error instanceof Error ? error.message : "Unknown error"}`
    };
  }
}
async function updateAllCelestialObjectImages(forceUpdate = false) {
  try {
    const allObjects = await db.select().from(celestialObjects);
    if (allObjects.length === 0) {
      return {
        success: true,
        message: "No celestial objects found in database",
        totalProcessed: 0,
        successCount: 0,
        failureCount: 0,
        results: []
      };
    }
    const objectsToUpdate = forceUpdate ? allObjects : allObjects.filter(
      (obj) => !obj.imageUrl || obj.imageUrl.includes("unsplash.com") || obj.imageUrl.includes("placeholder") || obj.imageUrl === ""
    );
    console.log(`Updating images for ${objectsToUpdate.length} celestial objects...`);
    const results = [];
    let successCount = 0;
    let failureCount = 0;
    for (const object of objectsToUpdate) {
      const result = await updateCelestialObjectImage(object.id);
      results.push({
        objectName: object.name,
        success: result.success,
        message: result.message,
        newImageUrl: result.newImageUrl
      });
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
      await new Promise((resolve) => setTimeout(resolve, 1e3));
    }
    return {
      success: true,
      message: `Processed ${objectsToUpdate.length} objects`,
      totalProcessed: objectsToUpdate.length,
      successCount,
      failureCount,
      results
    };
  } catch (error) {
    console.error(`Error updating all celestial object images:`, error);
    return {
      success: false,
      message: `Failed to update all images: ${error instanceof Error ? error.message : "Unknown error"}`,
      totalProcessed: 0,
      successCount: 0,
      failureCount: 0,
      results: []
    };
  }
}
var init_nasaImages = __esm({
  "server/services/nasaImages.ts"() {
    "use strict";
    init_db();
    init_schema();
    init_nasaImagesNode();
  }
});

// server/scripts/simpleMonthlyGuide.ts
var simpleMonthlyGuide_exports = {};
__export(simpleMonthlyGuide_exports, {
  createSimpleMonthlyGuide: () => createSimpleMonthlyGuide
});
async function createSimpleMonthlyGuide(month, year, hemisphere, headline, description, videoUrls = []) {
  try {
    console.log(`Creating monthly guide for ${month} ${year}`);
    const monthlyGuide = {
      month,
      year,
      hemisphere,
      headline,
      description,
      videoUrls,
      isAdmin: true
    };
    await storage.createMonthlyGuide(monthlyGuide);
    const featuredObjects = getFeaturedObjectsForMonth(month);
    let objectsAdded = 0;
    for (const obj of featuredObjects) {
      try {
        const existing = await storage.getCelestialObjectByName(obj.name);
        if (!existing) {
          await storage.createCelestialObject(obj);
          objectsAdded++;
        }
      } catch (error) {
        console.log(`Skipped object ${obj.name}:`, error);
      }
    }
    return {
      success: true,
      message: `Successfully created ${month} ${year} guide with ${objectsAdded} objects`,
      objectsAdded,
      guideUpdated: true
    };
  } catch (error) {
    console.error("Error creating monthly guide:", error);
    return {
      success: false,
      message: `Failed to create monthly guide: ${error instanceof Error ? error.message : "Unknown error"}`,
      objectsAdded: 0,
      guideUpdated: false
    };
  }
}
function getFeaturedObjectsForMonth(month) {
  const baseObjects = [
    {
      name: "Saturn",
      type: "planet",
      description: "The ringed planet, easily visible through telescopes with its distinctive ring system.",
      imageUrl: "https://images.unsplash.com/photo-1614313913007-2b4ae8ce32d6",
      magnitude: "0.2",
      coordinates: "RA 21h 15m, Dec -16\xB0 30'",
      constellation: "Aquarius",
      hemisphere: "Both",
      month
    },
    {
      name: "Jupiter",
      type: "planet",
      description: "The largest planet in our solar system, showing cloud bands and four bright moons through telescopes.",
      imageUrl: "https://images.unsplash.com/photo-1614313913007-2b4ae8ce32d6",
      magnitude: "-2.8",
      coordinates: "RA 22h 45m, Dec -12\xB0 15'",
      constellation: "Pisces",
      hemisphere: "Both",
      month
    }
  ];
  switch (month.toLowerCase()) {
    case "june":
      baseObjects.push({
        name: "M13",
        type: "star_cluster",
        description: "The Great Hercules Cluster - a stunning globular cluster with hundreds of thousands of stars.",
        imageUrl: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2",
        magnitude: "5.8",
        coordinates: "RA 16h 41m, Dec +36\xB0 28'",
        constellation: "Hercules",
        hemisphere: "Northern",
        month: "June"
      });
      break;
    case "july":
      baseObjects.push({
        name: "M57",
        type: "nebula",
        description: "The Ring Nebula - a beautiful planetary nebula resembling a cosmic donut.",
        imageUrl: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2",
        magnitude: "8.8",
        coordinates: "RA 18h 53m, Dec +33\xB0 02'",
        constellation: "Lyra",
        hemisphere: "Northern",
        month: "July"
      });
      break;
    default:
      baseObjects.push({
        name: "Andromeda Galaxy",
        type: "galaxy",
        description: "Our nearest major galactic neighbor, visible as a faint smudge to the naked eye.",
        imageUrl: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2",
        magnitude: "3.4",
        coordinates: "RA 00h 42m, Dec +41\xB0 16'",
        constellation: "Andromeda",
        hemisphere: "Northern",
        month
      });
  }
  return baseObjects;
}
var init_simpleMonthlyGuide = __esm({
  "server/scripts/simpleMonthlyGuide.ts"() {
    "use strict";
    init_storage();
  }
});

// api/_handler.ts
import express from "express";
import serverless from "serverless-http";

// server/routes.ts
init_storage();
import { z } from "zod";
import { createServer } from "http";

// server/services/nasaApi.ts
init_schema();
init_db();
import { eq as eq2, desc } from "drizzle-orm";
var NASA_API_KEY = process.env.NASA_API_KEY || "DEMO_KEY";
async function fetchApodFromNasaApi(date2) {
  const baseUrl = "https://api.nasa.gov/planetary/apod";
  const params = new URLSearchParams({ api_key: NASA_API_KEY });
  if (date2) params.set("date", date2);
  const url = `${baseUrl}?${params.toString()}`;
  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "StellarDiary/1.0 (+https://stellar-diary.vercel.app)"
    }
  });
  if (!response.ok) {
    const text2 = await response.text();
    throw new Error(`NASA APOD API error ${response.status}: ${text2}`);
  }
  const data = await response.json();
  const normalized = {
    date: data.date,
    title: data.title,
    explanation: data.explanation,
    url: data.url,
    hdurl: data.hdurl,
    media_type: data.media_type,
    service_version: data.service_version || "v1",
    copyright: data.copyright
  };
  return normalized;
}
async function fetchApod(date2, forceRefresh = false) {
  const today = /* @__PURE__ */ new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, "0");
  const day = today.getDate().toString().padStart(2, "0");
  const todayStr = `${year}-${month}-${day}`;
  const targetDate = date2 || todayStr;
  if (forceRefresh) {
    console.log(`Force refresh requested for APOD. Clearing cache for ${targetDate}`);
    try {
      await db.delete(apodCache).where(eq2(apodCache.date, targetDate));
      console.log(`Cleared cache entries for ${targetDate}`);
    } catch (err) {
      console.error("Error clearing cache during force refresh:", err);
    }
  } else {
    try {
      const cachedData = await db.select().from(apodCache).where(eq2(apodCache.date, targetDate));
      if (cachedData.length > 0) {
        console.log(`Using cached APOD data for ${targetDate}`);
        return cachedData[0];
      }
    } catch (err) {
      console.error("Error checking cache:", err);
    }
  }
  try {
    console.log(`Fetching APOD data from NASA API for ${targetDate}...`);
    const data = await fetchApodFromNasaApi(targetDate);
    console.log(`NASA API returned APOD data: ${data.title} (${data.date})`);
    try {
      const insertData = {
        date: data.date,
        title: data.title,
        explanation: data.explanation,
        url: data.url,
        hdurl: data.hdurl || null,
        media_type: data.media_type,
        copyright: data.copyright || null,
        service_version: data.service_version || null
      };
      await db.delete(apodCache).where(eq2(apodCache.date, data.date));
      await db.insert(apodCache).values(insertData);
      console.log(`Cached new APOD data for ${data.date}`);
    } catch (err) {
      console.error("Error caching APOD data:", err);
    }
    return data;
  } catch (error) {
    console.error("NASA API fetch failed:", error);
    try {
      const cachedEntries = await db.select().from(apodCache).orderBy(desc(apodCache.cached_at)).limit(1);
      if (cachedEntries.length > 0) {
        console.log("Using most recent cached APOD as fallback");
        return cachedEntries[0];
      }
    } catch (err) {
      console.error("Error fetching fallback from cache:", err);
    }
    return {
      date: targetDate,
      explanation: "We're experiencing some difficulties loading the NASA Astronomy Picture of the Day. Please try refreshing again or check back later.",
      media_type: "image",
      service_version: "v1",
      title: "NASA APOD Temporarily Unavailable",
      url: "https://apod.nasa.gov/apod/image/0612/sombrero_hst.jpg",
      copyright: "NASA"
    };
  }
}

// server/routes.ts
init_nasaImages();

// server/services/celestialObjects.ts
init_schema();
init_storage();
init_db();
var seedCelestialObjects = [
  {
    name: "Whirlpool Galaxy (M51)",
    type: "galaxy",
    description: "Spring is galaxy season, and one of the most popular targets for visual observers and astrophotographers alike is the Whirlpool Galaxy.",
    coordinates: "RA: 13h 29m 53s | Dec: +47\xB0 11\u2032 48\u2033",
    bestViewingTime: "Best after 9 PM",
    imageUrl: "https://science.nasa.gov/wp-content/uploads/2023/04/m51-and-companion_0-jpg.webp",
    visibilityRating: "Good Visibility",
    information: "It's conveniently located about three and a half degrees from Alkaid, the star at the end of the handle of the Big Dipper, and forms a triangle with another star, 24 Canum Venaticorum. Through a small scope, the galaxy appears as a faint patch, with some texture potentially being visible, while its tiny companion, NGC 5195, shows a starlike core. Larger telescopes (250mm, or 10 inches in aperture) are needed to clearly show its famous spiral arms.",
    constellation: "Canes Venatici",
    magnitude: "8.4",
    hemisphere: "Northern",
    recommendedEyepiece: "Low power first, then higher magnification",
    month: "April"
  },
  {
    name: "Leo Triplet (M65, M66, NGC 3628)",
    type: "galaxy",
    description: "The Leo Triplet is a small group of galaxies about 35 million light-years away in the constellation Leo consisting of M65, M66, and NGC 3628.",
    coordinates: "RA: 11h 20m | Dec: +13\xB0 00\u2032",
    bestViewingTime: "Best after 9 PM",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/83/Leo-Triplet.png",
    visibilityRating: "Good Visibility",
    information: "The two brightest galaxies in this trio - M65 and M66 - are bright enough to be spotted with binoculars, but you'll need a scope to see NGC 3628. A magnification of around 70x will show all three as elongated patches within the same field of view, but you'll likely need a scope of 250mm in aperture to see any detail.",
    constellation: "Leo",
    magnitude: "9.3",
    hemisphere: "Northern",
    recommendedEyepiece: "Low power, wide field eyepiece (25mm or higher)",
    month: "April"
  },
  {
    name: "Mizar & Alcor (Zeta Ursae Majoris)",
    type: "double_star",
    description: "An outstanding double star for beginners, located in the handle of the Big Dipper.",
    coordinates: "RA: 13h 23m 56s | Dec: +54\xB0 55\u2032 31\u2033",
    bestViewingTime: "Best after 8 PM",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e4/ALCOR_et_MIZAR_%287060991417%29.jpg",
    visibilityRating: "Excellent Visibility",
    information: "Look carefully with the naked eye at Mizar, the middle star in the handle of the Big Dipper, and you'll see a tiny star beside it. This is Alcor, and while the pair make a pretty sight for binoculars, almost any telescope will show Mizar itself to be double.",
    constellation: "Ursa Major",
    magnitude: "2.2",
    hemisphere: "Northern",
    recommendedEyepiece: "Low power eyepiece (30x)",
    month: "April"
  },
  {
    name: "Cor Caroli (Alpha Canum Venaticorum)",
    type: "double_star",
    description: "A relatively easy double star for beginners, located near the Big Dipper.",
    coordinates: "RA: 12h 56m 02s | Dec: +38\xB0 19\u2032 06\u2033",
    bestViewingTime: "Best after 9 PM",
    imageUrl: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/solar-system/skywatching/2025/april/skychart_m3_location_april_2025.png?w=1536&h=864&fit=crop&crop=faces%2Cfocalpoint",
    visibilityRating: "Good Visibility",
    information: "Like the Whirlpool Galaxy, Cor Caroli is located close to Alkaid in the Big Dipper, and like Mizar, it's a relatively easy double for beginners. A low magnification of around 30x will show a brilliant white star with a fainter creamy-white companion.",
    constellation: "Canes Venatici",
    magnitude: "2.9",
    hemisphere: "Northern",
    recommendedEyepiece: "Low power eyepiece (30x)",
    month: "April"
  },
  {
    name: "Mars Near Pollux",
    type: "planet",
    description: "Mars is visible just four degrees from Pollux in Gemini, giving observers the opportunity to compare their colors.",
    coordinates: "Varies by date",
    bestViewingTime: "Evening after sunset",
    imageUrl: "https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e000019/GSFC_20171208_Archive_e000019~large.jpg?w=1920&h=1536&fit=clip&crop=faces%2Cfocalpoint",
    visibilityRating: "Good Visibility",
    information: "Mars is just four degrees from Pollux in Gemini, giving observers the opportunity to compare their colors. You'll find them high in the southwest after sunset.",
    constellation: "Gemini",
    magnitude: "1.2",
    hemisphere: "Northern",
    recommendedEyepiece: "Medium power eyepiece (10-15mm)",
    month: "April"
  },
  {
    name: "Lyrid Meteor Shower",
    type: "other",
    description: "The Lyrids are one of the oldest recorded meteor showers, with observations dating back 2,700 years.",
    coordinates: "Radiant near star Vega",
    bestViewingTime: "April 21-22, after midnight",
    imageUrl: "https://dq0hsqwjhea1.cloudfront.net/Lyrids-2022-V2-1042x783.jpg",
    visibilityRating: "Good Visibility",
    information: "The Lyrids reach their maximum on the evening of the 21st but are best seen during the early hours of the 22nd. Fortunately, the Moon is a waning crescent this year, and its light won't brighten the sky, allowing you to see up to 18 shooting stars every hour under ideal conditions.",
    constellation: "Lyra",
    magnitude: "Variable",
    hemisphere: "Northern",
    recommendedEyepiece: "No telescope needed - use your naked eyes",
    month: "April"
  },
  {
    name: "Ring Nebula (M57)",
    type: "nebula",
    description: "The Ring Nebula is a planetary nebula in the northern constellation of Lyra. It's one of the most prominent examples of a planetary nebula, formed by an expanding shell of gas around an aging star.",
    coordinates: "RA: 18h 53m 35s | Dec: +33\xB0 01\u2032 45\u2033",
    bestViewingTime: "Best after 11 PM",
    imageUrl: "https://images.unsplash.com/photo-1520034475321-cbe63696469a?auto=format&fit=crop&w=800&h=500",
    visibilityRating: "Excellent Visibility",
    information: "The Ring Nebula is approximately 2,000 light-years away from Earth. It was formed when a dying star expelled its outer layers of gas into space.",
    constellation: "Lyra",
    magnitude: "8.8",
    hemisphere: "Northern",
    recommendedEyepiece: "Medium power eyepiece (10-15mm)",
    month: "May"
  },
  {
    name: "Jupiter & Its Moons",
    type: "planet",
    description: "Jupiter is a gas giant and the largest planet in our solar system. With your 8-inch Dobsonian, you'll be able to see its cloud bands and four Galilean moons: Io, Europa, Ganymede, and Callisto.",
    coordinates: "RA: 04h 30m | Dec: +20\xB0 00\u2032",
    bestViewingTime: "Early morning",
    imageUrl: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?auto=format&fit=crop&w=800&h=500",
    visibilityRating: "Excellent Visibility",
    information: "Jupiter takes about 12 Earth years to orbit the Sun. Its most notable feature, the Great Red Spot, is a giant storm that has been raging for at least 400 years.",
    constellation: "Varies",
    magnitude: "-2.2",
    hemisphere: "Both",
    recommendedEyepiece: "High power eyepiece (6-10mm)",
    month: "May"
  },
  {
    name: "Andromeda Galaxy (M31)",
    type: "galaxy",
    description: "The Andromeda Galaxy is the nearest major galaxy to our Milky Way. It's a spiral galaxy approximately 2.5 million light-years away and is visible to the naked eye on dark nights.",
    coordinates: "RA: 00h 42m 44s | Dec: +41\xB0 16\u2032 9\u2033",
    bestViewingTime: "Best on Fall and Winter evenings",
    imageUrl: "https://images.unsplash.com/photo-1438978401421-16031dd4a8ae?auto=format&fit=crop&w=800&h=500",
    visibilityRating: "Good Visibility",
    information: "The Andromeda Galaxy is the largest galaxy in the Local Group, which also includes the Milky Way, the Triangulum Galaxy, and about 30 other smaller galaxies.",
    constellation: "Andromeda",
    magnitude: "3.4",
    hemisphere: "Northern",
    recommendedEyepiece: "Low power, wide field eyepiece (25mm or higher)",
    month: "October"
  },
  {
    name: "Orion Nebula (M42)",
    type: "nebula",
    description: "The Orion Nebula is a diffuse nebula situated in the Milky Way, south of Orion's Belt. It is one of the brightest nebulae and visible to the naked eye.",
    coordinates: "RA: 05h 35m 17s | Dec: -05\xB0 23\u2032 28\u2033",
    bestViewingTime: "Winter evenings",
    imageUrl: "https://images.unsplash.com/photo-1579033078051-5ab3503cc953?auto=format&fit=crop&w=800&h=500",
    visibilityRating: "Excellent Visibility",
    information: "The Orion Nebula is approximately 1,344 light-years away and is the closest region of massive star formation to Earth.",
    constellation: "Orion",
    magnitude: "4.0",
    hemisphere: "Both",
    recommendedEyepiece: "Low power eyepiece (20-25mm)",
    month: "January"
  },
  {
    name: "Pleiades (M45)",
    type: "star_cluster",
    description: "The Pleiades, also known as the Seven Sisters, is an open star cluster containing middle-aged, hot B-type stars in the northwest of the constellation Taurus.",
    coordinates: "RA: 03h 47m 24s | Dec: +24\xB0 07\u2032 00\u2033",
    bestViewingTime: "Winter evenings",
    imageUrl: "https://images.unsplash.com/photo-1593331292296-1bb2644113cb?auto=format&fit=crop&w=800&h=500",
    visibilityRating: "Excellent Visibility",
    information: "The cluster contains over 1,000 statistically confirmed members, though its most recognizable feature is the small asterism of stars that appear together in the night sky.",
    constellation: "Taurus",
    magnitude: "1.6",
    hemisphere: "Both",
    recommendedEyepiece: "Low power, wide field eyepiece (25mm or higher)",
    month: "December"
  }
];
var seedMonthlyGuides = [
  {
    month: "April",
    year: 2025,
    headline: "Galaxy Season and Double Stars in the Northern Hemisphere",
    description: "Spring is galaxy season, and April 2025 offers excellent opportunities to observe spectacular galaxies like the Whirlpool and Leo Triplet. It's also a great time to observe the Lyrid meteor shower (peaking April 21-22) and interesting double stars like Mizar & Alcor and Cor Caroli. Mars can be found near Pollux in Gemini, and Jupiter remains visible in the early evening during the first half of the month.",
    hemisphere: "Northern"
  },
  {
    month: "April",
    year: 2025,
    headline: "Autumn Night Sky in the Southern Hemisphere",
    description: "April in the southern hemisphere brings clear views of the Large and Small Magellanic Clouds, as well as excellent visibility of the southern constellations like Crux and Centaurus.",
    hemisphere: "Southern"
  },
  {
    month: "May",
    year: 2025,
    headline: "Meteor Showers, Saturn, and Deep Sky Treasures",
    description: "May 2025 brings the beautiful Eta Aquariid meteor shower (peaking May 4-5), created from the debris of Halley's Comet. Saturn reaches opposition on May 7th, making it visible all night with its rings clearly visible in telescopes. The bright star Arcturus dominates the evening sky, while the constellation Virgo offers excellent galaxy hunting with M87, M84, and M86. In the early morning hours, spot Mars and Venus low on the eastern horizon.",
    hemisphere: "Northern"
  },
  {
    month: "June",
    year: 2025,
    headline: "Summer Nebulae and Globular Clusters",
    description: "June brings warmer nights and excellent viewing of nebulae and globular clusters in the Sagittarius region, including the Lagoon Nebula (M8) and Omega Nebula (M17).",
    hemisphere: "Northern"
  }
];
var seedTelescopeTips = [
  {
    title: "Collimating Your Apertura AD8 Dobsonian",
    content: "Good collimation is crucial for sharp views with your Apertura AD8. The included laser collimator makes this easy with just two main steps: 1) First, align the secondary mirror by adjusting the secondary mirror housing hex screws until the laser hits the center spot on the primary mirror. 2) Then, align the primary mirror by loosening the white thumb screws and adjusting the black knobs until the laser returns back to the laser collimator's 45-degree reflective surface. This process takes under 2 minutes once you've practiced a few times and will significantly improve your viewing experience.",
    category: "Maintenance",
    imageUrl: "/collimate_AD8.jpg"
  },
  {
    title: "Best Eyepieces for Your Dob",
    content: "Discover which eyepieces work best with your 8-inch Dobsonian for different celestial objects, from planets to deep sky targets.",
    category: "Equipment",
    imageUrl: "https://images.unsplash.com/photo-1536697246787-1f7ae568d89a?auto=format&fit=crop&w=600&h=300"
  },
  {
    title: "Understanding Aperture",
    content: "When it comes to telescopes, there's one key feature that stands out from everything else: aperture. The aperture of a telescope is the diameter of the lens or mirror, and the bigger the aperture, the more light the telescope can gather. As a result, observers are able to identify fainter objects and see more detail than would be possible with a smaller aperture scope. The downside? Larger apertures can lack portability, and of course, they cost more!",
    category: "Astronomy Basics",
    imageUrl: "https://images.unsplash.com/photo-1522124624696-7ea32eb9592c?auto=format&fit=crop&w=600&h=300"
  }
];
async function seedDatabase() {
  const existingObjects = await storage.getAllCelestialObjects();
  if (existingObjects.length === 0) {
    for (const object of seedCelestialObjects) {
      await storage.createCelestialObject(object);
    }
    console.log("Seeded celestial objects");
  } else {
    for (const seedObject of seedCelestialObjects) {
      const existingObject = await storage.getCelestialObjectByName(seedObject.name);
      if (!existingObject) {
        console.log(`Adding new celestial object "${seedObject.name}" from seed data`);
        await storage.createCelestialObject(seedObject);
      }
    }
  }
  const existingGuides = await storage.getAllMonthlyGuides();
  if (existingGuides.length === 0) {
    for (const guide of seedMonthlyGuides) {
      await storage.createMonthlyGuide(guide);
    }
    console.log("Seeded monthly guides");
  }
  const existingTips = await storage.getAllTelescopeTips();
  if (existingTips.length === 0) {
    for (const tip of seedTelescopeTips) {
      await storage.createTelescopeTip(tip);
    }
    console.log("Seeded telescope tips");
  }
  try {
    const existingApodEntries = await db.select().from(apodCache);
    if (existingApodEntries.length === 0) {
      const today = /* @__PURE__ */ new Date();
      const year = 2025;
      const month = today.getMonth() + 1;
      const day = today.getDate();
      const formattedDate = `${year}-${month < 10 ? "0" + month : month}-${day < 10 ? "0" + day : day}`;
      const defaultApod = {
        date: formattedDate,
        title: "A Happy Sky over Bufa Hill in Mexico",
        explanation: "Sometimes, the sky itself seems to smile. A few days ago, visible over much of the world, an unusual superposition of our Moon with the planets Venus and Saturn created just such an iconic facial expression. Specifically, a crescent Moon appeared to make a happy face on the night sky when paired with seemingly nearby planets.",
        media_type: "image",
        service_version: "v1",
        url: "https://apod.nasa.gov/apod/image/2504/HappySkyMexico_Korona_960.jpg",
        hdurl: "https://apod.nasa.gov/apod/image/2504/HappySkyMexico_Korona_1358.jpg",
        copyright: "Daniel Korona"
      };
      await db.insert(apodCache).values(defaultApod);
      console.log("Seeded APOD cache with default entry");
    }
  } catch (error) {
    console.error("Error checking APOD cache:", error);
  }
}
function getCurrentMonth() {
  return (/* @__PURE__ */ new Date()).toLocaleString("default", { month: "long" });
}
function getCurrentYear() {
  return (/* @__PURE__ */ new Date()).getFullYear();
}
async function filterCelestialObjects(type, month, hemisphere) {
  let objects = await storage.getAllCelestialObjects();
  if (type) {
    objects = objects.filter((obj) => obj.type === type);
  }
  if (month) {
    objects = objects.filter((obj) => obj.month === month);
  }
  if (hemisphere) {
    objects = objects.filter(
      (obj) => obj.hemisphere === hemisphere || obj.hemisphere?.toLowerCase() === "both" || obj.hemisphere === "Both"
    );
  }
  return objects;
}

// server/services/cleanupDuplicates.ts
init_storage();
async function cleanupDuplicateCelestialObjects() {
  try {
    console.log("Starting cleanup of duplicate celestial objects...");
    const allObjects = await storage.getAllCelestialObjects();
    const objectsByName = /* @__PURE__ */ new Map();
    allObjects.forEach((obj) => {
      if (!objectsByName.has(obj.name)) {
        objectsByName.set(obj.name, []);
      }
      objectsByName.get(obj.name).push(obj);
    });
    let removedCount = 0;
    const entries = Array.from(objectsByName.entries());
    for (const [name, objects] of entries) {
      if (objects.length > 1) {
        console.log(`Found ${objects.length} entries for "${name}"`);
        objects.sort((a, b) => {
          const aIsUnsplash = a.imageUrl?.includes("unsplash.com") || false;
          const bIsUnsplash = b.imageUrl?.includes("unsplash.com") || false;
          if (aIsUnsplash && !bIsUnsplash) return 1;
          if (!aIsUnsplash && bIsUnsplash) return -1;
          return 0;
        });
        const keepObject = objects[0];
        const objectsToRemove = objects.slice(1);
        console.log(`Keeping "${name}" with ID ${keepObject.id} and image ${keepObject.imageUrl}`);
        for (const objToRemove of objectsToRemove) {
          console.log(`Removing duplicate "${name}" with ID ${objToRemove.id}`);
          await storage.deleteCelestialObject(objToRemove.id);
          removedCount++;
        }
      }
    }
    console.log(`Cleanup complete. Removed ${removedCount} duplicate celestial objects.`);
  } catch (error) {
    console.error("Error during duplicate cleanup:", error);
    throw error;
  }
}
async function celestialObjectExists(name) {
  const existingObject = await storage.getCelestialObjectByName(name);
  return !!existingObject;
}

// server/routes.ts
init_schema();
async function registerRoutes(app2, options) {
  const isServerless = process.env.VERCEL === "1" || options?.skipSeeding;
  if (!isServerless) {
    await seedDatabase();
    await cleanupDuplicateCelestialObjects();
  }
  app2.get("/api/apod", async (req, res) => {
    try {
      const { date: date2, refresh } = req.query;
      const forceRefresh = refresh === "true";
      console.log(`APOD request received - Date: ${date2 || "current"}, Force refresh: ${forceRefresh}`);
      if (forceRefresh) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        console.log("APOD cache headers set for forced refresh");
      } else {
        res.setHeader("Cache-Control", "public, max-age=3600");
        console.log("APOD cache headers set for normal request");
      }
      console.log("Fetching APOD data from service...");
      const apodData = await fetchApod(date2, forceRefresh);
      console.log(`APOD data returned: ${apodData.title} (${apodData.date})`);
      res.json(apodData);
    } catch (error) {
      console.error("NASA APOD API error:", error);
      res.status(500).json({
        message: `Failed to fetch APOD: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  });
  app2.get("/api/celestial-objects", async (req, res) => {
    try {
      const { type, month, hemisphere } = req.query;
      if (type || month || hemisphere) {
        const objects2 = await filterCelestialObjects(
          type,
          month,
          hemisphere
        );
        return res.json(objects2);
      }
      const objects = await storage.getAllCelestialObjects();
      res.json(objects);
    } catch (error) {
      res.status(500).json({
        message: `Failed to get celestial objects: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  });
  app2.get("/api/celestial-objects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const object = await storage.getCelestialObject(id);
      if (!object) {
        return res.status(404).json({ message: "Celestial object not found" });
      }
      res.json(object);
    } catch (error) {
      res.status(500).json({
        message: `Failed to get celestial object: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  });
  app2.post("/api/celestial-objects", async (req, res) => {
    try {
      let imageUrl = req.body.imageUrl;
      let imageSource = "fallback";
      if (req.body.name) {
        try {
          console.log(`\u{1F50D} Searching for image (NASA/Wikipedia) for: ${req.body.name}`);
          const result = await searchCelestialObjectImage2(req.body.name);
          if (result.success && result.image_url) {
            imageUrl = result.image_url;
            imageSource = result.source || "unknown";
            console.log(`\u2713 Found image for ${req.body.name} [${imageSource}]: ${imageUrl}`);
          } else {
            console.log(`\u26A0 No image found for ${req.body.name}: ${result.error || "No image available"}`);
          }
        } catch (error) {
          console.error(`\u274C Image search failed for ${req.body.name}:`, error);
        }
      }
      if (!imageUrl) {
        const objectType = req.body.type || "galaxy";
        const fallbackImages = {
          "galaxy": "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=800&h=500",
          "nebula": "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=800&h=500",
          "star cluster": "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=800&h=500",
          "planet": "https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&w=800&h=500",
          "star": "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=800&h=500",
          "double star": "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=800&h=500",
          "variable star": "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=800&h=500"
        };
        const key = objectType.toLowerCase();
        imageUrl = fallbackImages[key] || fallbackImages["galaxy"];
        imageSource = "fallback";
        console.log(`\u{1F4F8} Using fallback image for type "${objectType}": ${imageUrl}`);
      }
      const validatedData = insertCelestialObjectSchema.parse({
        ...req.body,
        // Set default values for required fields if they're not provided
        visibilityRating: req.body.visibilityRating || "Custom",
        information: req.body.information || "Custom celestial object",
        // Use best image found
        imageUrl,
        // Other fields
        constellation: req.body.constellation || "Not specified",
        magnitude: req.body.magnitude || "Not specified",
        recommendedEyepiece: req.body.recommendedEyepiece || "Not specified"
      });
      const exists = await celestialObjectExists(validatedData.name);
      if (exists) {
        return res.status(409).json({
          message: `A celestial object with the name "${validatedData.name}" already exists`
        });
      }
      const newObject = await storage.createCelestialObject(validatedData);
      const response = {
        ...newObject,
        _debug: {
          imageSource
        }
      };
      res.status(201).json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({
        message: `Failed to create celestial object: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  });
  app2.get("/api/celestial-object-types", async (_req, res) => {
    try {
      res.json(celestialObjectTypes);
    } catch (error) {
      res.status(500).json({
        message: `Failed to get celestial object types: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  });
  app2.patch("/api/celestial-objects/:id/update-image", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      const result = await updateCelestialObjectImage(id);
      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      res.status(500).json({
        message: `Failed to update celestial object image: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  });
  app2.post("/api/celestial-objects/update-all-images", async (req, res) => {
    try {
      const { forceUpdate } = req.body;
      const result = await updateAllCelestialObjectImages(forceUpdate || false);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        message: `Failed to update all celestial object images: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  });
  app2.get("/api/monthly-guide", async (req, res) => {
    try {
      const month = req.query.month || getCurrentMonth();
      const year = parseInt(req.query.year || getCurrentYear().toString());
      const hemisphere = req.query.hemisphere || "Northern";
      const guides = await storage.getAllMonthlyGuides();
      const guide = guides.find(
        (g) => g.month === month && g.year === year && (g.hemisphere === hemisphere || g.hemisphere === "both")
      );
      if (!guide) {
        return res.status(404).json({ message: "Monthly guide not found" });
      }
      res.json(guide);
    } catch (error) {
      res.status(500).json({
        message: `Failed to get monthly guide: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  });
  app2.patch("/api/monthly-guide/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      const guide = await storage.getMonthlyGuide(id);
      if (!guide) {
        return res.status(404).json({ message: "Monthly guide not found" });
      }
      const updatedGuide = await storage.updateMonthlyGuide(id, req.body);
      res.json(updatedGuide);
    } catch (error) {
      res.status(500).json({
        message: `Failed to update monthly guide: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  });
  app2.get("/api/observations", async (req, res) => {
    try {
      const userId = 1;
      const observations2 = await storage.getUserObservations(userId);
      const enhancedObservations = await Promise.all(
        observations2.map(async (obs) => {
          const celestialObject = await storage.getCelestialObject(obs.objectId);
          return {
            ...obs,
            celestialObject
          };
        })
      );
      res.json(enhancedObservations);
    } catch (error) {
      res.status(500).json({
        message: `Failed to get observations: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  });
  app2.post("/api/observations", async (req, res) => {
    try {
      const validatedData = insertObservationSchema.parse(req.body);
      const object = await storage.getCelestialObject(validatedData.objectId);
      if (!object) {
        return res.status(404).json({ message: "Celestial object not found" });
      }
      const userId = 1;
      validatedData.userId = userId;
      const newObservation = await storage.createObservation(validatedData);
      res.status(201).json(newObservation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({
        message: `Failed to create observation: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  });
  app2.patch("/api/observations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const observation = await storage.getObservation(id);
      if (!observation) {
        return res.status(404).json({ message: "Observation not found" });
      }
      const userId = 1;
      if (observation.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this observation" });
      }
      const updatedObservation = await storage.updateObservation(id, req.body);
      res.json(updatedObservation);
    } catch (error) {
      res.status(500).json({
        message: `Failed to update observation: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  });
  app2.delete("/api/observations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const observation = await storage.getObservation(id);
      if (!observation) {
        return res.status(404).json({ message: "Observation not found" });
      }
      const userId = 1;
      if (observation.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this observation" });
      }
      await storage.deleteObservation(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({
        message: `Failed to delete observation: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  });
  app2.get("/api/telescope-tips", async (req, res) => {
    try {
      const { category } = req.query;
      if (category) {
        const tips2 = await storage.getTelescopeTipsByCategory(category);
        return res.json(tips2);
      }
      const tips = await storage.getAllTelescopeTips();
      res.json(tips);
    } catch (error) {
      res.status(500).json({
        message: `Failed to get telescope tips: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  });
  app2.post("/api/admin/update-monthly-guide", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ message: "URL is required" });
      }
      const currentDate = /* @__PURE__ */ new Date();
      const month = currentDate.toLocaleString("default", { month: "long" });
      const year = currentDate.getFullYear();
      const { createSimpleMonthlyGuide: createSimpleMonthlyGuide2 } = await Promise.resolve().then(() => (init_simpleMonthlyGuide(), simpleMonthlyGuide_exports));
      const result = await createSimpleMonthlyGuide2(
        month,
        year,
        "Northern",
        `${month} ${year}: Astronomy Highlights`,
        `Featured celestial objects and viewing opportunities for ${month} ${year}. Content imported from: ${url}`,
        []
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Failed to update monthly guide: ${error instanceof Error ? error.message : "Unknown error"}`,
        objectsAdded: 0,
        guideUpdated: false
      });
    }
  });
  app2.post("/api/admin/manual-monthly-guide", async (req, res) => {
    try {
      const { month, year, hemisphere, headline, description, videoUrls } = req.body;
      if (!month || !year || !headline || !description) {
        return res.status(400).json({
          success: false,
          message: "Month, year, headline, and description are required",
          objectsAdded: 0,
          guideUpdated: false
        });
      }
      const monthlyGuide = {
        month,
        year: parseInt(year),
        hemisphere: hemisphere || "Northern",
        headline,
        description,
        videoUrls: videoUrls || [],
        isAdmin: true
      };
      await storage.createMonthlyGuide(monthlyGuide);
      res.json({
        success: true,
        message: `Successfully created ${month} ${year} guide`,
        objectsAdded: 0,
        guideUpdated: true
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Failed to create manual guide: ${error instanceof Error ? error.message : "Unknown error"}`,
        objectsAdded: 0,
        guideUpdated: false
      });
    }
  });
  app2.post("/api/admin/create-july-guide", async (req, res) => {
    try {
      const featuredObjects = [
        {
          name: "Messier 4",
          type: "star_cluster",
          description: "One of the closest globular clusters to Earth at just 7,200 light-years away. M4 is located in the constellation Scorpius and offers spectacular views of individual stars even in modest telescopes.",
          constellation: "Scorpius",
          magnitude: "5.9",
          coordinates: "RA: 16h 23m 35s | Dec: -26\xB0 31\u2032 32\u2033",
          visibility: "Best viewing in southern sky after 10 PM",
          tips: "Use medium magnification to resolve individual stars. The cluster has a distinctive bar-like feature across its center that's visible in larger telescopes."
        },
        {
          name: "Lagoon Nebula (M8)",
          type: "nebula",
          description: "A stunning emission nebula in Sagittarius, the Lagoon Nebula is one of the most spectacular deep-sky objects visible from Earth. This star-forming region glows beautifully in telescopes.",
          constellation: "Sagittarius",
          magnitude: "6.0",
          coordinates: "RA: 18h 03m 37s | Dec: -24\xB0 23\u2032 12\u2033",
          visibility: "Excellent visibility in dark skies, visible to naked eye",
          tips: "Use a nebula filter to enhance contrast. Low to medium magnification reveals the dark lane that gives it the 'lagoon' appearance."
        },
        {
          name: "Eagle Nebula (M16)",
          type: "nebula",
          description: "Famous for the Hubble Space Telescope's 'Pillars of Creation' image, the Eagle Nebula is an active star-forming region in Serpens constellation with incredible detail visible in telescopes.",
          constellation: "Serpens",
          magnitude: "6.4",
          coordinates: "RA: 18h 18m 48s | Dec: -13\xB0 49\u2032 00\u2033",
          visibility: "Best viewed in dark skies with telescopes",
          tips: "Use nebula filter and medium magnification. Look for the dark pillars and bright star cluster embedded within the nebula."
        },
        {
          name: "Saturn and Neptune Conjunction",
          type: "planet",
          description: "In July 2025, Saturn and Neptune appear remarkably close together in the sky, offering a rare opportunity to observe both planets in the same telescopic field of view.",
          constellation: "Aquarius",
          magnitude: "0.1 (Saturn), 7.8 (Neptune)",
          coordinates: "RA: Variable | Dec: Variable (Close conjunction)",
          visibility: "Best viewing after 11 PM, look for Saturn first",
          tips: "Start with Saturn to locate the pair, then use high magnification to spot Neptune nearby. Saturn's rings and Neptune's blue disk make a stunning contrast."
        }
      ];
      let objectsAdded = 0;
      const mapObjectType = (type) => {
        const typeMap = {
          "galaxy": "galaxy",
          "nebula": "nebula",
          "planet": "planet",
          "star_cluster": "star_cluster",
          "double_star": "double_star",
          "star": "double_star",
          "moon": "moon",
          "meteor_shower": "other",
          "comet": "other"
        };
        return typeMap[type.toLowerCase()] || "other";
      };
      const getRecommendedEyepiece = (type) => {
        const eyepieceMap = {
          "planet": "High power (6-10mm) for planetary detail",
          "nebula": "Medium power (12-20mm) with nebula filter",
          "star_cluster": "Low to medium power (20-40mm) for full cluster view",
          "double_star": "High power (6-12mm) to split close pairs",
          "galaxy": "Low to medium power (20-40mm) for extended objects"
        };
        return eyepieceMap[type] || "Medium power recommended";
      };
      for (const obj of featuredObjects) {
        const celestialObject = {
          name: obj.name,
          type: mapObjectType(obj.type),
          description: obj.description,
          coordinates: obj.coordinates,
          bestViewingTime: obj.visibility,
          imageUrl: `https://images.unsplash.com/photo-1446776877081-d282a0f896e2?auto=format&fit=crop&w=800&h=500`,
          visibilityRating: obj.visibility,
          information: obj.tips,
          constellation: obj.constellation,
          magnitude: obj.magnitude,
          hemisphere: "Northern",
          recommendedEyepiece: getRecommendedEyepiece(obj.type),
          month: "July"
        };
        try {
          const existingObject = await storage.getCelestialObjectByName(obj.name);
          if (!existingObject) {
            await storage.createCelestialObject(celestialObject);
            console.log(`\u2713 Added ${obj.name} (${obj.type})`);
            objectsAdded++;
          } else {
            console.log(`\u26A0 Skipped ${obj.name} (already exists)`);
          }
        } catch (error) {
          console.log(`\u26A0 Error processing ${obj.name}: ${error}`);
        }
      }
      res.json({
        success: true,
        message: `Successfully created July 2025 guide with ${objectsAdded} featured objects from High Point Scientific video`,
        objectsAdded,
        guideUpdated: true
      });
    } catch (error) {
      console.error("Error creating July 2025 guide:", error);
      res.status(500).json({
        success: false,
        message: `Failed to create July guide: ${error instanceof Error ? error.message : "Unknown error"}`,
        objectsAdded: 0,
        guideUpdated: false
      });
    }
  });
  app2.post("/api/admin/update-object-image/:id", async (req, res) => {
    try {
      const objectId = parseInt(req.params.id);
      if (isNaN(objectId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid object ID"
        });
      }
      const { updateCelestialObjectImage: updateCelestialObjectImage2 } = await Promise.resolve().then(() => (init_nasaImages(), nasaImages_exports));
      const result = await updateCelestialObjectImage2(objectId);
      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      console.error("Error updating celestial object image:", error);
      res.status(500).json({
        success: false,
        message: `Failed to update image: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  });
  app2.post("/api/admin/update-all-images", async (req, res) => {
    try {
      const { forceUpdate } = req.body;
      const { updateAllCelestialObjectImages: updateAllCelestialObjectImages2 } = await Promise.resolve().then(() => (init_nasaImages(), nasaImages_exports));
      const result = await updateAllCelestialObjectImages2(forceUpdate || false);
      res.json(result);
    } catch (error) {
      console.error("Error updating all celestial object images:", error);
      res.status(500).json({
        success: false,
        message: `Failed to update images: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  });
  app2.get("/api/admin/preview-nasa-image/:objectName", async (req, res) => {
    try {
      const objectName = decodeURIComponent(req.params.objectName);
      const { previewCelestialObjectImageSearch: previewCelestialObjectImageSearch3 } = await Promise.resolve().then(() => (init_nasaImages(), nasaImages_exports));
      const result = await previewCelestialObjectImageSearch3(objectName);
      res.json(result);
    } catch (error) {
      console.error("Error previewing NASA image search:", error);
      res.status(500).json({
        success: false,
        message: `Failed to preview image search: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  });
  if (isServerless) {
    return null;
  }
  const httpServer = createServer(app2);
  return httpServer;
}

// api/_handler.ts
var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
var routesRegistered = false;
var registerRoutesOnce = async () => {
  if (!routesRegistered) {
    await registerRoutes(app, { skipSeeding: true });
    routesRegistered = true;
  }
};
var handler = serverless(app);
async function handler_default(req, res) {
  await registerRoutesOnce();
  return handler(req, res);
}
export {
  handler_default as default
};
