import {
  User, InsertUser,
  CelestialObject, InsertCelestialObject,
  Observation, InsertObservation,
  MonthlyGuide, InsertMonthlyGuide,
  GuideObject, InsertGuideObject,
  TelescopeTip, InsertTelescopeTip,
  users, celestialObjects, observations,
  monthlyGuides, guideObjects, telescopeTips, apodCache
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, inArray } from "drizzle-orm";

// Extend the storage interface with all required CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Celestial objects operations (static catalog)
  getCelestialObject(id: number): Promise<CelestialObject | undefined>;
  getCelestialObjectByName(name: string): Promise<CelestialObject | undefined>;
  getAllCelestialObjects(): Promise<CelestialObject[]>;
  getCelestialObjectsByType(type: string): Promise<CelestialObject[]>;
  getCelestialObjectsByIds(ids: number[]): Promise<CelestialObject[]>;
  createCelestialObject(object: InsertCelestialObject): Promise<CelestialObject>;
  updateCelestialObject(id: number, object: Partial<CelestialObject>): Promise<CelestialObject | undefined>;
  deleteCelestialObject(id: number): Promise<boolean>;
  
  // Observation operations
  getObservation(id: number): Promise<Observation | undefined>;
  getUserObservations(userId: number): Promise<Observation[]>;
  createObservation(observation: InsertObservation): Promise<Observation>;
  updateObservation(id: number, observation: Partial<Observation>): Promise<Observation | undefined>;
  deleteObservation(id: number): Promise<boolean>;
  
  // Monthly guides operations
  getMonthlyGuide(id: number): Promise<MonthlyGuide | undefined>;
  getMonthlyGuideByMonthYear(month: string, year: number, hemisphere: string): Promise<MonthlyGuide | undefined>;
  getCurrentMonthlyGuide(hemisphere: string): Promise<MonthlyGuide | undefined>;
  getAllMonthlyGuides(): Promise<MonthlyGuide[]>;
  createMonthlyGuide(guide: InsertMonthlyGuide): Promise<MonthlyGuide>;
  updateMonthlyGuide(id: number, guide: Partial<MonthlyGuide>): Promise<MonthlyGuide | undefined>;
  deleteMonthlyGuide(id: number): Promise<boolean>;

  // Guide objects operations (links objects to guides)
  getGuideObjects(guideId: number): Promise<GuideObject[]>;
  getGuideObjectsWithDetails(guideId: number): Promise<(GuideObject & { object: CelestialObject })[]>;
  createGuideObject(guideObject: InsertGuideObject): Promise<GuideObject>;
  deleteGuideObjectsByGuide(guideId: number): Promise<boolean>;
  
  // Telescope tips operations
  getTelescopeTip(id: number): Promise<TelescopeTip | undefined>;
  getAllTelescopeTips(): Promise<TelescopeTip[]>;
  getTelescopeTipsByCategory(category: string): Promise<TelescopeTip[]>;
  createTelescopeTip(tip: InsertTelescopeTip): Promise<TelescopeTip>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getCelestialObject(id: number): Promise<CelestialObject | undefined> {
    const [object] = await db.select().from(celestialObjects).where(eq(celestialObjects.id, id));
    return object || undefined;
  }
  
  async getCelestialObjectByName(name: string): Promise<CelestialObject | undefined> {
    const [object] = await db.select().from(celestialObjects).where(eq(celestialObjects.name, name));
    return object || undefined;
  }

  async getAllCelestialObjects(): Promise<CelestialObject[]> {
    return await db.select().from(celestialObjects);
  }

  async getCelestialObjectsByType(type: string): Promise<CelestialObject[]> {
    return await db.select().from(celestialObjects).where(eq(celestialObjects.type, type));
  }

  async getCelestialObjectsByIds(ids: number[]): Promise<CelestialObject[]> {
    if (ids.length === 0) return [];
    return await db.select().from(celestialObjects).where(inArray(celestialObjects.id, ids));
  }

  async createCelestialObject(insertObject: InsertCelestialObject): Promise<CelestialObject> {
    const [object] = await db
      .insert(celestialObjects)
      .values(insertObject)
      .returning();
    return object;
  }

  async updateCelestialObject(id: number, update: Partial<CelestialObject>): Promise<CelestialObject | undefined> {
    const [updatedObject] = await db
      .update(celestialObjects)
      .set(update)
      .where(eq(celestialObjects.id, id))
      .returning();
    return updatedObject || undefined;
  }

  async deleteCelestialObject(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(celestialObjects)
      .where(eq(celestialObjects.id, id))
      .returning();
    return !!deleted;
  }

  async getObservation(id: number): Promise<Observation | undefined> {
    const [observation] = await db.select().from(observations).where(eq(observations.id, id));
    return observation || undefined;
  }

  async getUserObservations(userId: number): Promise<Observation[]> {
    return await db.select().from(observations).where(eq(observations.userId, userId));
  }

  async createObservation(insertObservation: InsertObservation): Promise<Observation> {
    const [observation] = await db
      .insert(observations)
      .values(insertObservation)
      .returning();
    return observation;
  }

  async updateObservation(id: number, update: Partial<Observation>): Promise<Observation | undefined> {
    const [updatedObservation] = await db
      .update(observations)
      .set(update)
      .where(eq(observations.id, id))
      .returning();
    return updatedObservation || undefined;
  }

  async deleteObservation(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(observations)
      .where(eq(observations.id, id))
      .returning();
    return !!deleted;
  }

  async getMonthlyGuide(id: number): Promise<MonthlyGuide | undefined> {
    const [guide] = await db.select().from(monthlyGuides).where(eq(monthlyGuides.id, id));
    return guide || undefined;
  }

  async getMonthlyGuideByMonthYear(month: string, year: number, hemisphere: string): Promise<MonthlyGuide | undefined> {
    const [guide] = await db.select().from(monthlyGuides).where(
      and(
        eq(monthlyGuides.month, month),
        eq(monthlyGuides.year, year),
        or(
          eq(monthlyGuides.hemisphere, hemisphere),
          eq(monthlyGuides.hemisphere, 'Both')
        )
      )
    );
    return guide || undefined;
  }

  async getCurrentMonthlyGuide(hemisphere: string): Promise<MonthlyGuide | undefined> {
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentYear = new Date().getFullYear();
    return this.getMonthlyGuideByMonthYear(currentMonth, currentYear, hemisphere);
  }

  async getAllMonthlyGuides(): Promise<MonthlyGuide[]> {
    return await db.select().from(monthlyGuides);
  }

  async createMonthlyGuide(insertGuide: InsertMonthlyGuide): Promise<MonthlyGuide> {
    const [guide] = await db
      .insert(monthlyGuides)
      .values(insertGuide)
      .returning();
    return guide;
  }

  async updateMonthlyGuide(id: number, update: Partial<MonthlyGuide>): Promise<MonthlyGuide | undefined> {
    const [updatedGuide] = await db
      .update(monthlyGuides)
      .set(update)
      .where(eq(monthlyGuides.id, id))
      .returning();
    return updatedGuide || undefined;
  }

  async deleteMonthlyGuide(id: number): Promise<boolean> {
    // First delete all guide objects for this guide
    await db.delete(guideObjects).where(eq(guideObjects.guideId, id));
    // Then delete the guide itself
    const [deleted] = await db
      .delete(monthlyGuides)
      .where(eq(monthlyGuides.id, id))
      .returning();
    return !!deleted;
  }

  // Guide objects operations
  async getGuideObjects(guideId: number): Promise<GuideObject[]> {
    return await db.select().from(guideObjects)
      .where(eq(guideObjects.guideId, guideId))
      .orderBy(guideObjects.sortOrder);
  }

  async getGuideObjectsWithDetails(guideId: number): Promise<(GuideObject & { object: CelestialObject })[]> {
    const gos = await this.getGuideObjects(guideId);
    const objectIds = gos.map(go => go.objectId);
    const objects = await this.getCelestialObjectsByIds(objectIds);
    const objectMap = new Map(objects.map(o => [o.id, o]));

    return gos.map(go => ({
      ...go,
      object: objectMap.get(go.objectId)!
    })).filter(go => go.object !== undefined);
  }

  async createGuideObject(insertGuideObject: InsertGuideObject): Promise<GuideObject> {
    const [guideObject] = await db
      .insert(guideObjects)
      .values(insertGuideObject)
      .returning();
    return guideObject;
  }

  async deleteGuideObjectsByGuide(guideId: number): Promise<boolean> {
    await db.delete(guideObjects).where(eq(guideObjects.guideId, guideId));
    return true;
  }

  async getTelescopeTip(id: number): Promise<TelescopeTip | undefined> {
    const [tip] = await db.select().from(telescopeTips).where(eq(telescopeTips.id, id));
    return tip || undefined;
  }

  async getAllTelescopeTips(): Promise<TelescopeTip[]> {
    return await db.select().from(telescopeTips);
  }

  async getTelescopeTipsByCategory(category: string): Promise<TelescopeTip[]> {
    return await db.select().from(telescopeTips).where(eq(telescopeTips.category, category));
  }

  async createTelescopeTip(insertTip: InsertTelescopeTip): Promise<TelescopeTip> {
    const [tip] = await db
      .insert(telescopeTips)
      .values(insertTip)
      .returning();
    return tip;
  }
}

// Use DatabaseStorage instead of MemStorage for persistent storage
export const storage = new DatabaseStorage();