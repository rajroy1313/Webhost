import { type User, type InsertUser, type Bot, type InsertBot } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Bot methods
  getBot(id: string): Promise<Bot | undefined>;
  getBotsByUserId(userId: string): Promise<Bot[]>;
  getPublicBots(): Promise<Bot[]>;
  createBot(bot: InsertBot & { userId: string; filePath: string }): Promise<Bot>;
  updateBot(id: string, updates: Partial<Bot>): Promise<Bot | undefined>;
  deleteBot(id: string): Promise<boolean>;
  searchBots(query: string, category?: string): Promise<Bot[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private bots: Map<string, Bot>;

  constructor() {
    this.users = new Map();
    this.bots = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async getBot(id: string): Promise<Bot | undefined> {
    return this.bots.get(id);
  }

  async getBotsByUserId(userId: string): Promise<Bot[]> {
    return Array.from(this.bots.values()).filter(
      (bot) => bot.userId === userId,
    );
  }

  async getPublicBots(): Promise<Bot[]> {
    return Array.from(this.bots.values()).filter(
      (bot) => bot.isPublic === true,
    );
  }

  async createBot(botData: InsertBot & { userId: string; filePath: string }): Promise<Bot> {
    const id = randomUUID();
    const bot: Bot = {
      ...botData,
      description: botData.description || null,
      id,
      status: "stopped",
      processId: null,
      cpuUsage: 0,
      memoryUsage: 0,
      uptime: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.bots.set(id, bot);
    return bot;
  }

  async updateBot(id: string, updates: Partial<Bot>): Promise<Bot | undefined> {
    const bot = this.bots.get(id);
    if (!bot) return undefined;
    
    const updatedBot = { ...bot, ...updates, updatedAt: new Date() };
    this.bots.set(id, updatedBot);
    return updatedBot;
  }

  async deleteBot(id: string): Promise<boolean> {
    return this.bots.delete(id);
  }

  async searchBots(query: string, category?: string): Promise<Bot[]> {
    const bots = Array.from(this.bots.values()).filter(
      (bot) => bot.isPublic === true,
    );

    let filtered = bots;

    if (query) {
      const lowercaseQuery = query.toLowerCase();
      filtered = filtered.filter(
        (bot) =>
          bot.name.toLowerCase().includes(lowercaseQuery) ||
          bot.description?.toLowerCase().includes(lowercaseQuery),
      );
    }

    if (category && category !== "All Categories") {
      filtered = filtered.filter((bot) => bot.category === category);
    }

    return filtered;
  }
}

export const storage = new MemStorage();
