import { 
  User, InsertUser, 
  CelestialObject, InsertCelestialObject,
  Observation, InsertObservation,
  MonthlyGuide, InsertMonthlyGuide,
  TelescopeTip, InsertTelescopeTip
} from "@shared/schema";

// Extend the storage interface with all required CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Celestial objects operations
  getCelestialObject(id: number): Promise<CelestialObject | undefined>;
  getAllCelestialObjects(): Promise<CelestialObject[]>;
  getCelestialObjectsByType(type: string): Promise<CelestialObject[]>;
  getCelestialObjectsByMonth(month: string): Promise<CelestialObject[]>;
  getCelestialObjectsByHemisphere(hemisphere: string): Promise<CelestialObject[]>;
  createCelestialObject(object: InsertCelestialObject): Promise<CelestialObject>;
  
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
  
  // Telescope tips operations
  getTelescopeTip(id: number): Promise<TelescopeTip | undefined>;
  getAllTelescopeTips(): Promise<TelescopeTip[]>;
  getTelescopeTipsByCategory(category: string): Promise<TelescopeTip[]>;
  createTelescopeTip(tip: InsertTelescopeTip): Promise<TelescopeTip>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private celestialObjects: Map<number, CelestialObject>;
  private observations: Map<number, Observation>;
  private monthlyGuides: Map<number, MonthlyGuide>;
  private telescopeTips: Map<number, TelescopeTip>;
  
  private userCurrentId: number;
  private objectCurrentId: number;
  private observationCurrentId: number;
  private guideCurrentId: number;
  private tipCurrentId: number;

  constructor() {
    this.users = new Map();
    this.celestialObjects = new Map();
    this.observations = new Map();
    this.monthlyGuides = new Map();
    this.telescopeTips = new Map();
    
    this.userCurrentId = 1;
    this.objectCurrentId = 1;
    this.observationCurrentId = 1;
    this.guideCurrentId = 1;
    this.tipCurrentId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Celestial objects operations
  async getCelestialObject(id: number): Promise<CelestialObject | undefined> {
    return this.celestialObjects.get(id);
  }

  async getAllCelestialObjects(): Promise<CelestialObject[]> {
    return Array.from(this.celestialObjects.values());
  }

  async getCelestialObjectsByType(type: string): Promise<CelestialObject[]> {
    return Array.from(this.celestialObjects.values()).filter(
      (object) => object.type === type,
    );
  }

  async getCelestialObjectsByMonth(month: string): Promise<CelestialObject[]> {
    return Array.from(this.celestialObjects.values()).filter(
      (object) => object.month === month,
    );
  }

  async getCelestialObjectsByHemisphere(hemisphere: string): Promise<CelestialObject[]> {
    return Array.from(this.celestialObjects.values()).filter(
      (object) => object.hemisphere === hemisphere || object.hemisphere === 'both',
    );
  }

  async createCelestialObject(insertObject: InsertCelestialObject): Promise<CelestialObject> {
    const id = this.objectCurrentId++;
    const object: CelestialObject = { ...insertObject, id };
    this.celestialObjects.set(id, object);
    return object;
  }

  // Observation operations
  async getObservation(id: number): Promise<Observation | undefined> {
    return this.observations.get(id);
  }

  async getUserObservations(userId: number): Promise<Observation[]> {
    return Array.from(this.observations.values()).filter(
      (observation) => observation.userId === userId,
    );
  }

  async createObservation(insertObservation: InsertObservation): Promise<Observation> {
    const id = this.observationCurrentId++;
    const dateAdded = new Date();
    const observation: Observation = { ...insertObservation, id, dateAdded };
    this.observations.set(id, observation);
    return observation;
  }

  async updateObservation(id: number, update: Partial<Observation>): Promise<Observation | undefined> {
    const observation = this.observations.get(id);
    if (!observation) return undefined;
    
    const updatedObservation = { ...observation, ...update };
    this.observations.set(id, updatedObservation);
    return updatedObservation;
  }

  async deleteObservation(id: number): Promise<boolean> {
    return this.observations.delete(id);
  }

  // Monthly guides operations
  async getMonthlyGuide(id: number): Promise<MonthlyGuide | undefined> {
    return this.monthlyGuides.get(id);
  }

  async getCurrentMonthlyGuide(hemisphere: string): Promise<MonthlyGuide | undefined> {
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentYear = new Date().getFullYear();
    
    return Array.from(this.monthlyGuides.values()).find(
      (guide) => guide.month === currentMonth && 
                guide.year === currentYear && 
                (guide.hemisphere === hemisphere || guide.hemisphere === 'both'),
    );
  }

  async getAllMonthlyGuides(): Promise<MonthlyGuide[]> {
    return Array.from(this.monthlyGuides.values());
  }

  async createMonthlyGuide(insertGuide: InsertMonthlyGuide): Promise<MonthlyGuide> {
    const id = this.guideCurrentId++;
    const guide: MonthlyGuide = { ...insertGuide, id };
    this.monthlyGuides.set(id, guide);
    return guide;
  }

  // Telescope tips operations
  async getTelescopeTip(id: number): Promise<TelescopeTip | undefined> {
    return this.telescopeTips.get(id);
  }

  async getAllTelescopeTips(): Promise<TelescopeTip[]> {
    return Array.from(this.telescopeTips.values());
  }

  async getTelescopeTipsByCategory(category: string): Promise<TelescopeTip[]> {
    return Array.from(this.telescopeTips.values()).filter(
      (tip) => tip.category === category,
    );
  }

  async createTelescopeTip(insertTip: InsertTelescopeTip): Promise<TelescopeTip> {
    const id = this.tipCurrentId++;
    const tip: TelescopeTip = { ...insertTip, id };
    this.telescopeTips.set(id, tip);
    return tip;
  }
}

export const storage = new MemStorage();
