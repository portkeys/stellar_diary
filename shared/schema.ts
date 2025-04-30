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

// Celestial objects schema
export const celestialObjects = pgTable("celestial_objects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  coordinates: text("coordinates").notNull(), // RA and Dec in format: "RAh RAm RAs | Dec° Dec′ Dec″"
  bestViewingTime: text("best_viewing_time"), // Time range or specific month
  imageUrl: text("image_url"), // URL to image
  visibilityRating: text("visibility_rating"), // Poor, Good, Excellent
  information: text("information"), // Additional object info
  constellation: text("constellation"), // Constellation it belongs to
  magnitude: text("magnitude"), // Visual magnitude
  hemisphere: text("hemisphere"), // Northern, Southern, Both
  recommendedEyepiece: text("recommended_eyepiece"), // Suggestions for viewing
  month: text("month"), // Month when it's best to observe
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

export const insertObservationSchema = createInsertSchema(observations).omit({
  id: true,
  dateAdded: true,
});

// Monthly sky guides schema
export const monthlyGuides = pgTable("monthly_guides", {
  id: serial("id").primaryKey(),
  month: text("month").notNull(), // January, February, etc.
  year: integer("year").notNull(),
  headline: text("headline").notNull(),
  description: text("description").notNull(),
  hemisphere: text("hemisphere").notNull(), // Northern, Southern, Both
});

export const insertMonthlyGuideSchema = createInsertSchema(monthlyGuides).omit({
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

export type TelescopeTip = typeof telescopeTips.$inferSelect;
export type InsertTelescopeTip = z.infer<typeof insertTelescopeTipSchema>;

// NASA APOD response type
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
