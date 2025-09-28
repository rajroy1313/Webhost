import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { sessionMiddleware, requireAuth, getCurrentUser } from "./middleware/auth";
import { botManager } from "./services/botManager";
import { validateRepository, downloadRepository } from "./services/githubClient";
import https from "https";
import AdmZip from "adm-zip";
import { insertUserSchema, insertBotSchema, loginSchema } from "@shared/schema";

const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['.zip', '.js', '.py', '.ts', '.json'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowedTypes.includes(ext));
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(sessionMiddleware);

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email) || 
                           await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      req.session.userId = user.id;
      
      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email 
        } 
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid registration data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(credentials.email);
      if (!user) {
        console.log("User not found for email:", credentials.email);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      console.log("User found, comparing passwords");
      const isValidPassword = await bcrypt.compare(credentials.password, user.password);
      if (!isValidPassword) {
        console.log("Password comparison failed");
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      console.log("Login successful for user:", user.email);
      
      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email 
        } 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Invalid login data" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    res.json({ 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email 
      } 
    });
  });

  // Bot routes
  app.get("/api/bots", requireAuth, async (req, res) => {
    try {
      const bots = await storage.getBotsByUserId((req as any).user.id);
      res.json(bots);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bots" });
    }
  });

  app.get("/api/bots/:id", requireAuth, async (req, res) => {
    try {
      const bot = await storage.getBot(req.params.id);
      if (!bot) {
        return res.status(404).json({ message: "Bot not found" });
      }
      
      // Check if user owns the bot or if it's public
      if (bot.userId !== (req as any).user.id && !bot.isPublic) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(bot);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bot" });
    }
  });

  app.post("/api/bots/upload", requireAuth, upload.single("file"), async (req, res) => {
    try {
      if (!(req as any).file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const botData = insertBotSchema.parse(JSON.parse(req.body.config || "{}"));
      
      // Create bot directory
      const botDir = path.join("bots", (req as any).user.id, Date.now().toString());
      fs.mkdirSync(botDir, { recursive: true });
      
      // Move and extract file if needed
      const filePath = path.join(botDir, (req as any).file.originalname);
      fs.renameSync((req as any).file.path, filePath);
      
      const bot = await storage.createBot({
        ...botData,
        userId: (req as any).user.id,
        filePath,
      });

      res.json(bot);
    } catch (error) {
      res.status(400).json({ message: "Failed to upload bot" });
    }
  });

  app.post("/api/bots/github", requireAuth, async (req, res) => {
    try {
      const { repositoryUrl, ...botData } = req.body;
      
      if (!repositoryUrl) {
        return res.status(400).json({ message: "Repository URL is required" });
      }

      // Validate repository
      const validation = await validateRepository(repositoryUrl);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.error });
      }

      const parsedBotData = insertBotSchema.parse(botData);
      
      // Create bot directory
      const botDir = path.join("bots", (req as any).user.id, Date.now().toString());
      fs.mkdirSync(botDir, { recursive: true });
      
      // Download repository archive
      const archiveData = await downloadRepository(repositoryUrl, botDir);
      
      // Save archive and extract
      const archivePath = path.join(botDir, "repository.zip");
      fs.writeFileSync(archivePath, archiveData as any, 'binary');
      
      // Extract the archive
      const zip = new AdmZip(archivePath);
      zip.extractAllTo(botDir, true);
      
      // Remove the zip file
      fs.unlinkSync(archivePath);
      
      // Find the extracted folder (GitHub archives create a folder with commit hash)
      const extractedFolders = fs.readdirSync(botDir).filter(item => 
        fs.statSync(path.join(botDir, item)).isDirectory()
      );
      
      let mainDir = botDir;
      if (extractedFolders.length > 0) {
        mainDir = path.join(botDir, extractedFolders[0]);
      }
      
      const bot = await storage.createBot({
        ...parsedBotData,
        userId: (req as any).user.id,
        filePath: mainDir,
      });

      res.json(bot);
    } catch (error: any) {
      console.error("GitHub deployment error:", error);
      res.status(500).json({ message: error.message || "Failed to deploy from GitHub" });
    }
  });

  app.post("/api/github/validate", requireAuth, async (req, res) => {
    try {
      const { repositoryUrl } = req.body;
      
      if (!repositoryUrl) {
        return res.status(400).json({ message: "Repository URL is required" });
      }

      const validation = await validateRepository(repositoryUrl);
      res.json(validation);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to validate repository" });
    }
  });

  app.post("/api/bots/:id/start", requireAuth, async (req, res) => {
    try {
      const bot = await storage.getBot(req.params.id);
      if (!bot || bot.userId !== (req as any).user.id) {
        return res.status(404).json({ message: "Bot not found" });
      }

      const success = await botManager.startBot(bot.id);
      if (success) {
        res.json({ message: "Bot started successfully" });
      } else {
        res.status(500).json({ message: "Failed to start bot" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to start bot" });
    }
  });

  app.post("/api/bots/:id/stop", requireAuth, async (req, res) => {
    try {
      const bot = await storage.getBot(req.params.id);
      if (!bot || bot.userId !== (req as any).user.id) {
        return res.status(404).json({ message: "Bot not found" });
      }

      const success = await botManager.stopBot(bot.id);
      if (success) {
        res.json({ message: "Bot stopped successfully" });
      } else {
        res.status(500).json({ message: "Failed to stop bot" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to stop bot" });
    }
  });

  app.post("/api/bots/:id/restart", requireAuth, async (req, res) => {
    try {
      const bot = await storage.getBot(req.params.id);
      if (!bot || bot.userId !== (req as any).user.id) {
        return res.status(404).json({ message: "Bot not found" });
      }

      const success = await botManager.restartBot(bot.id);
      if (success) {
        res.json({ message: "Bot restarted successfully" });
      } else {
        res.status(500).json({ message: "Failed to restart bot" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to restart bot" });
    }
  });

  app.delete("/api/bots/:id", requireAuth, async (req, res) => {
    try {
      const bot = await storage.getBot(req.params.id);
      if (!bot || bot.userId !== (req as any).user.id) {
        return res.status(404).json({ message: "Bot not found" });
      }

      const success = await botManager.deleteBot(bot.id);
      if (success) {
        res.json({ message: "Bot deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete bot" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete bot" });
    }
  });

  app.put("/api/bots/:id", requireAuth, async (req, res) => {
    try {
      const bot = await storage.getBot(req.params.id);
      if (!bot || bot.userId !== (req as any).user.id) {
        return res.status(404).json({ message: "Bot not found" });
      }

      const updates = insertBotSchema.partial().parse(req.body);
      const updatedBot = await storage.updateBot(bot.id, updates);
      
      res.json(updatedBot);
    } catch (error) {
      res.status(400).json({ message: "Failed to update bot" });
    }
  });

  // Public gallery routes
  app.get("/api/gallery", async (req, res) => {
    try {
      const { search, category } = req.query;
      const bots = await storage.searchBots(
        search as string || "",
        category as string
      );
      res.json(bots);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch gallery" });
    }
  });

  app.get("/api/stats", requireAuth, async (req, res) => {
    try {
      const bots = await storage.getBotsByUserId((req as any).user.id);
      
      const activeBots = bots.filter(bot => bot.status === "running").length;
      const totalRequests = bots.reduce((sum, bot) => sum + (bot.uptime || 0), 0);
      const avgCpuUsage = bots.length > 0 
        ? Math.round(bots.reduce((sum, bot) => sum + (bot.cpuUsage || 0), 0) / bots.length)
        : 0;
      
      res.json({
        activeBots,
        totalBots: bots.length,
        totalRequests,
        avgCpuUsage,
        uptime: 99.9,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
