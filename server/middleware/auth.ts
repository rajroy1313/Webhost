import { Request, Response, NextFunction } from "express";
import session from "express-session";
import { storage } from "../storage";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "default-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
});

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const user = await storage.getUser(req.session.userId);
  if (!user) {
    req.session.userId = undefined;
    return res.status(401).json({ message: "User not found" });
  }

  (req as any).user = user;
  next();
}

export async function getCurrentUser(req: Request): Promise<any> {
  if (!req.session.userId) return null;
  return await storage.getUser(req.session.userId);
}
