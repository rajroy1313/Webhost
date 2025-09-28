import { db } from "./db";
import { users, bots, type User, type InsertUser, type Bot, type InsertBot } from "@shared/schema";
import { eq, and, or, ilike } from "drizzle-orm";

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

export class PostgreSQLStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getBot(id: string): Promise<Bot | undefined> {
    const result = await db.select().from(bots).where(eq(bots.id, id)).limit(1);
    return result[0];
  }

  async getBotsByUserId(userId: string): Promise<Bot[]> {
    return await db.select().from(bots).where(eq(bots.userId, userId));
  }

  async getPublicBots(): Promise<Bot[]> {
    return await db.select().from(bots).where(eq(bots.isPublic, true));
  }

  async createBot(botData: InsertBot & { userId: string; filePath: string }): Promise<Bot> {
    const result = await db.insert(bots).values(botData).returning();
    return result[0];
  }

  async updateBot(id: string, updates: Partial<Bot>): Promise<Bot | undefined> {
    const result = await db.update(bots)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(bots.id, id))
      .returning();
    return result[0];
  }

  async deleteBot(id: string): Promise<boolean> {
    const result = await db.delete(bots).where(eq(bots.id, id)).returning();
    return result.length > 0;
  }

  async searchBots(query: string, category?: string): Promise<Bot[]> {
    let whereClause = eq(bots.isPublic, true);

    if (query) {
      whereClause = and(
        whereClause,
        or(
          ilike(bots.name, `%${query}%`),
          ilike(bots.description, `%${query}%`)
        )
      );
    }

    if (category) {
      whereClause = and(whereClause, eq(bots.category, category));
    }

    return await db.select().from(bots).where(whereClause);
  }
}

// Export storage instance
export const storage = new PostgreSQLStorage();