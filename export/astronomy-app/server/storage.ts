import { 
  User, InsertUser, 
  CelestialObject, InsertCelestialObject,
  Observation, InsertObservation,
  MonthlyGuide, InsertMonthlyGuide,
  TelescopeTip, InsertTelescopeTip,
  users, celestialObjects, observations, 
  monthlyGuides, telescopeTips, apodCache
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or } from "drizzle-orm";

// Extend the storage interface with all required CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Celestial objects operations
  getCelestialObject(id: number): Promise<CelestialObject | undefined>;
  getCelestialObjectByName(name: string): Promise<CelestialObject | undefined>;
  getAllCelestialObjects(): Promise<CelestialObject[]>;
  getCelestialObjectsByType(type: string): Promise<CelestialObject[]>;
  getCelestialObjectsByMonth(month: string): Promise<CelestialObject[]>;
  getCelestialObjectsByHemisphere(hemisphere: string): Promise<CelestialObject[]>;
  createCelestialObject(object: InsertCelestialObject): Promise<CelestialObject>;
  deleteCelestialObject(id: number): Promise<boolean>;
  
  // Observation operations
  getObservation(id: number): Promise<Observation | undefined>;
  getUserObservations(userId: number): Promise<Observation[]>;
  createObservation(observation: InsertObservation): Promise<Observation>;
  updateObservation(id: number, observation: Partial<Observation>): Promise<Observation | undefined>;
  deleteObservation(id: number): Promise<boolean>;
  
  // Monthly guides operations
  getMonthlyGuide(id: number): Promise<MonthlyGuide | undefined>;
  getCurrentMonthlyGuide(hemisphere: string): Promise<MonthlyGuide | undefined>;
  getAllMonthlyGuides(): Promise<MonthlyGuide[]>;
  createMonthlyGuide(guide: InsertMonthlyGuide): Promise<MonthlyGuide>;
  updateMonthlyGuide(id: number, guide: Partial<MonthlyGuide>): Promise<MonthlyGuide | undefined>;
  
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

  async getCelestialObjectsByMonth(month: string): Promise<CelestialObject[]> {
    return await db.select().from(celestialObjects).where(eq(celestialObjects.month, month));
  }

  async getCelestialObjectsByHemisphere(hemisphere: string): Promise<CelestialObject[]> {
    // For hemisphere we need to check both exact match and 'both'
    if (hemisphere === 'both') {
      return await db.select().from(celestialObjects);
    } else {
      return await db.select().from(celestialObjects).where(
        or(
          eq(celestialObjects.hemisphere, hemisphere), 
          eq(celestialObjects.hemisphere, 'both')
        )
      );
    }
  }

  async createCelestialObject(insertObject: InsertCelestialObject): Promise<CelestialObject> {
    const [object] = await db
      .insert(celestialObjects)
      .values(insertObject)
      .returning();
    return object;
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

  async getCurrentMonthlyGuide(hemisphere: string): Promise<MonthlyGuide | undefined> {
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentYear = new Date().getFullYear();
    
    const [guide] = await db.select().from(monthlyGuides).where(
      and(
        eq(monthlyGuides.month, currentMonth),
        eq(monthlyGuides.year, currentYear),
        or(
          eq(monthlyGuides.hemisphere, hemisphere),
          eq(monthlyGuides.hemisphere, 'both')
        )
      )
    );
    return guide || undefined;
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