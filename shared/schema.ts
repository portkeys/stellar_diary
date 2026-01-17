import { pgTable, text, serial, integer, boolean, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Base user schema from the template
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Define celestial object types
export const celestialObjectTypes = ["planet", "galaxy", "nebula", "star_cluster", "double_star", "moon", "other"] as const;
export type CelestialObjectType = typeof celestialObjectTypes[number];

// Celestial objects schema (static catalog - object info that doesn't change)
export const celestialObjects = pgTable("celestial_objects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"), // URL to image (2MASS for Messier, NASA for others)
  constellation: text("constellation"), // Constellation it belongs to
  magnitude: text("magnitude"), // Visual magnitude
});

export const insertCelestialObjectSchema = createInsertSchema(celestialObjects).omit({
  id: true,
});

// User observation list schema
export const observations = pgTable("observations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"), // Not enforcing foreign key in memory storage
  objectId: integer("object_id"), // Not enforcing foreign key in memory storage
  isObserved: boolean("is_observed").default(false),
  observationNotes: text("observation_notes"),
  dateAdded: timestamp("date_added").defaultNow(),
  plannedDate: date("planned_date"),
});

// Create a modified schema with better validation
export const insertObservationSchema = createInsertSchema(observations)
  .omit({
    id: true,
    dateAdded: true,
  })
  .transform((data) => {
    // If plannedDate is empty or undefined, set it to null
    if (!data.plannedDate) {
      data.plannedDate = null;
    }
    return data;
  });

// Monthly sky guides schema
export const monthlyGuides = pgTable("monthly_guides", {
  id: serial("id").primaryKey(),
  month: text("month").notNull(), // January, February, etc.
  year: integer("year").notNull(),
  headline: text("headline").notNull(),
  description: text("description").notNull(),
  hemisphere: text("hemisphere").notNull(), // Northern, Southern, Both
  videoUrls: text("video_urls").array(), // Array of YouTube video URLs
  sources: text("sources").array(), // URLs of source articles (High Point Scientific, Sky & Telescope)
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMonthlyGuideSchema = createInsertSchema(monthlyGuides).omit({
  id: true,
  createdAt: true,
});

// Guide objects junction table - links celestial objects to specific monthly guides
export const guideObjects = pgTable("guide_objects", {
  id: serial("id").primaryKey(),
  guideId: integer("guide_id").notNull(), // FK to monthly_guides
  objectId: integer("object_id").notNull(), // FK to celestial_objects
  viewingTips: text("viewing_tips"), // Time-specific tips ("Best after 9 PM", "Look near Orion")
  highlights: text("highlights"), // Why it's special this month ("Opposition", "Close to Moon on 15th")
  sortOrder: integer("sort_order").default(0), // For ordering objects in the guide
});

export const insertGuideObjectSchema = createInsertSchema(guideObjects).omit({
  id: true,
});

// Telescope tips schema
export const telescopeTips = pgTable("telescope_tips", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(), // Collimation, Eyepieces, Maintenance, etc.
  imageUrl: text("image_url"),
});

export const insertTelescopeTipSchema = createInsertSchema(telescopeTips).omit({
  id: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type CelestialObject = typeof celestialObjects.$inferSelect;
export type InsertCelestialObject = z.infer<typeof insertCelestialObjectSchema>;

export type Observation = typeof observations.$inferSelect;
export type InsertObservation = z.infer<typeof insertObservationSchema>;

export type MonthlyGuide = typeof monthlyGuides.$inferSelect;
export type InsertMonthlyGuide = z.infer<typeof insertMonthlyGuideSchema>;

export type GuideObject = typeof guideObjects.$inferSelect;
export type InsertGuideObject = z.infer<typeof insertGuideObjectSchema>;

export type TelescopeTip = typeof telescopeTips.$inferSelect;
export type InsertTelescopeTip = z.infer<typeof insertTelescopeTipSchema>;

// NASA APOD response type
export const apodCache = pgTable("apod_cache", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  title: text("title").notNull(),
  explanation: text("explanation").notNull(),
  url: text("url").notNull(),
  hdurl: text("hdurl"),
  media_type: text("media_type").notNull(),
  copyright: text("copyright"),
  service_version: text("service_version"),
  cached_at: timestamp("cached_at").defaultNow().notNull(),
});

export const insertApodCacheSchema = createInsertSchema(apodCache).omit({
  id: true,
  cached_at: true,
});

export type ApodCache = typeof apodCache.$inferSelect;
export type InsertApodCache = z.infer<typeof insertApodCacheSchema>;

export interface ApodResponse {
  date: string;
  explanation: string;
  hdurl?: string;
  media_type: string;
  service_version: string;
  title: string;
  url: string;
  copyright?: string;
}
