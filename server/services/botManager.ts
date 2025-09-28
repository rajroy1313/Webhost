import { spawn, ChildProcess } from "child_process";
import path from "path";
import fs from "fs";
import { storage } from "../storage";
import { Bot } from "@shared/schema";

class BotManager {
  private runningBots: Map<string, ChildProcess> = new Map();
  private botMetrics: Map<string, { cpu: number; memory: number; uptime: number }> = new Map();

  async startBot(botId: string): Promise<boolean> {
    try {
      const bot = await storage.getBot(botId);
      if (!bot) throw new Error("Bot not found");

      if (this.runningBots.has(botId)) {
        await this.stopBot(botId);
      }

      const workingDir = path.dirname(bot.filePath);
      const envVariables: Record<string, string> = { ...process.env, ...(bot.envVariables as Record<string, string> || {}) };

      let command: string;
      let args: string[];

      // Parse the start command
      const commandParts = bot.startCommand.split(" ");
      command = commandParts[0];
      args = commandParts.slice(1);

      // Adjust command based on runtime
      if (bot.runtime.includes("Node")) {
        if (command !== "node" && command !== "npm" && command !== "yarn") {
          command = "node";
          args = [bot.startCommand.replace("node ", "")];
        }
      } else if (bot.runtime.includes("Python")) {
        if (command !== "python" && command !== "python3") {
          command = "python3";
          args = [bot.startCommand.replace(/python3?\s/, "")];
        }
      }

      const childProcess = spawn(command, args, {
        cwd: workingDir,
        env: envVariables,
        stdio: ["pipe", "pipe", "pipe"],
      });

      this.runningBots.set(botId, childProcess);
      
      // Track bot start time for uptime calculation
      const startTime = Date.now();
      this.botMetrics.set(botId, { cpu: 0, memory: 0, uptime: 0 });

      // Update bot status
      await storage.updateBot(botId, {
        status: "running",
        processId: childProcess.pid || null,
      });

      // Handle process events
      childProcess.on("error", async (error: any) => {
        console.error(`Bot ${botId} error:`, error);
        await this.handleBotError(botId, error.message);
      });

      childProcess.on("exit", async (code: any) => {
        console.log(`Bot ${botId} exited with code ${code}`);
        this.runningBots.delete(botId);
        this.botMetrics.delete(botId);
        
        if (code !== 0) {
          await storage.updateBot(botId, {
            status: "error",
            processId: null,
          });
        } else {
          await storage.updateBot(botId, {
            status: "stopped",
            processId: null,
          });
        }
      });

      // Start metrics collection
      this.startMetricsCollection(botId, startTime);

      return true;
    } catch (error: any) {
      console.error(`Failed to start bot ${botId}:`, error);
      await this.handleBotError(botId, error.message);
      return false;
    }
  }

  async stopBot(botId: string): Promise<boolean> {
    try {
      const process = this.runningBots.get(botId);
      if (!process) return false;

      process.kill("SIGTERM");
      
      // Force kill after 5 seconds if not terminated
      setTimeout(() => {
        if (!process.killed) {
          process.kill("SIGKILL");
        }
      }, 5000);

      this.runningBots.delete(botId);
      this.botMetrics.delete(botId);

      await storage.updateBot(botId, {
        status: "stopped",
        processId: null,
        cpuUsage: 0,
        memoryUsage: 0,
        uptime: 0,
      });

      return true;
    } catch (error) {
      console.error(`Failed to stop bot ${botId}:`, error);
      return false;
    }
  }

  async restartBot(botId: string): Promise<boolean> {
    await this.stopBot(botId);
    // Wait a moment before restarting
    await new Promise(resolve => setTimeout(resolve, 1000));
    return await this.startBot(botId);
  }

  private async handleBotError(botId: string, errorMessage: string) {
    this.runningBots.delete(botId);
    this.botMetrics.delete(botId);
    
    await storage.updateBot(botId, {
      status: "error",
      processId: null,
      cpuUsage: 0,
      memoryUsage: 0,
    });
  }

  private startMetricsCollection(botId: string, startTime: number) {
    const interval = setInterval(async () => {
      if (!this.runningBots.has(botId)) {
        clearInterval(interval);
        return;
      }

      const process = this.runningBots.get(botId);
      if (!process || !process.pid) {
        clearInterval(interval);
        return;
      }

      try {
        // Calculate uptime
        const uptime = Math.floor((Date.now() - startTime) / 1000);
        
        // Simulate CPU and memory usage (in a real implementation, you'd use system monitoring)
        const cpu = Math.floor(Math.random() * 30) + 5; // 5-35%
        const memory = Math.floor(Math.random() * 200) + 100; // 100-300MB

        this.botMetrics.set(botId, { cpu, memory, uptime });

        await storage.updateBot(botId, {
          cpuUsage: cpu,
          memoryUsage: memory,
          uptime,
        });
      } catch (error) {
        console.error(`Error collecting metrics for bot ${botId}:`, error);
      }
    }, 5000); // Update every 5 seconds
  }

  getBotStatus(botId: string) {
    return {
      isRunning: this.runningBots.has(botId),
      metrics: this.botMetrics.get(botId) || { cpu: 0, memory: 0, uptime: 0 },
    };
  }

  async deleteBot(botId: string): Promise<boolean> {
    try {
      // Stop the bot if it's running
      if (this.runningBots.has(botId)) {
        await this.stopBot(botId);
      }

      const bot = await storage.getBot(botId);
      if (bot) {
        // Clean up bot files
        try {
          if (fs.existsSync(bot.filePath)) {
            fs.rmSync(path.dirname(bot.filePath), { recursive: true, force: true });
          }
        } catch (error) {
          console.warn(`Failed to clean up files for bot ${botId}:`, error);
        }
      }

      return await storage.deleteBot(botId);
    } catch (error) {
      console.error(`Failed to delete bot ${botId}:`, error);
      return false;
    }
  }
}

export const botManager = new BotManager();
