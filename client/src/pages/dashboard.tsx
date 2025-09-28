import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { BotStatusBadge } from "@/components/bot-status-badge";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Bot } from "@shared/schema";
import {
  Play,
  Square,
  RotateCcw,
  Settings,
  Plus,
  TrendingUp,
  Bot as BotIcon,
  Server,
  Shield,
  Trash2,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bots = [], isLoading: botsLoading } = useQuery<Bot[]>({
    queryKey: ["/api/bots"],
  });

  const { data: stats = { activeBots: 0, totalBots: 0, avgCpuUsage: 0, uptime: 99.9 } } = useQuery({
    queryKey: ["/api/stats"],
  });

  const startBotMutation = useMutation({
    mutationFn: (botId: string) => apiRequest("POST", `/api/bots/${botId}/start`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      toast({ title: "Bot started successfully" });
    },
    onError: () => {
      toast({ title: "Failed to start bot", variant: "destructive" });
    },
  });

  const stopBotMutation = useMutation({
    mutationFn: (botId: string) => apiRequest("POST", `/api/bots/${botId}/stop`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      toast({ title: "Bot stopped successfully" });
    },
    onError: () => {
      toast({ title: "Failed to stop bot", variant: "destructive" });
    },
  });

  const restartBotMutation = useMutation({
    mutationFn: (botId: string) => apiRequest("POST", `/api/bots/${botId}/restart`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      toast({ title: "Bot restarted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to restart bot", variant: "destructive" });
    },
  });

  const deleteBotMutation = useMutation({
    mutationFn: (botId: string) => apiRequest("DELETE", `/api/bots/${botId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      toast({ title: "Bot deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete bot", variant: "destructive" });
    },
  });

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (botsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex">
          <Sidebar botCount={0} />
          <main className="flex-1 p-6">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        <Sidebar botCount={bots.length} />
        <main className="flex-1 p-6">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground" data-testid="title-dashboard">
                  Dashboard Overview
                </h2>
                <p className="text-muted-foreground mt-1">
                  Monitor and manage your hosted bots
                </p>
              </div>
              <Link href="/upload">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-deploy-bot">
                  <Plus className="mr-2 h-4 w-4" />
                  Deploy New Bot
                </Button>
              </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">Active Bots</p>
                      <p className="text-2xl font-bold text-foreground mt-2" data-testid="stat-active-bots">
                        {stats.activeBots}
                      </p>
                    </div>
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <BotIcon className="text-green-400 h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-green-400 text-sm font-medium">
                      {stats.activeBots > 0 ? "Running smoothly" : "No active bots"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">Total Bots</p>
                      <p className="text-2xl font-bold text-foreground mt-2" data-testid="stat-total-bots">
                        {stats.totalBots}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <TrendingUp className="text-blue-400 h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-blue-400 text-sm font-medium">Total deployed</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">Avg CPU Usage</p>
                      <p className="text-2xl font-bold text-foreground mt-2" data-testid="stat-cpu-usage">
                        {stats.avgCpuUsage}%
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-500/20 rounded-lg">
                      <Server className="text-yellow-400 h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-yellow-400 text-sm font-medium">
                      {stats.avgCpuUsage < 50 ? "Normal usage" : "High usage"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">Uptime</p>
                      <p className="text-2xl font-bold text-foreground mt-2" data-testid="stat-uptime">
                        {stats.uptime}%
                      </p>
                    </div>
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <Shield className="text-green-400 h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-green-400 text-sm font-medium">Excellent</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bot Status Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">Your Bots</CardTitle>
              </CardHeader>
              <CardContent>
                {bots.length === 0 ? (
                  <div className="text-center py-12">
                    <BotIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No bots deployed</h3>
                    <p className="text-muted-foreground mb-4">
                      Get started by uploading your first bot
                    </p>
                    <Link href="/upload">
                      <Button data-testid="button-upload-first-bot">
                        <Plus className="mr-2 h-4 w-4" />
                        Upload Bot
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/30">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Bot Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Runtime
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            CPU
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Memory
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {bots.map((bot) => (
                          <tr key={bot.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-bot-${bot.id}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center mr-3">
                                  <BotIcon className="text-primary h-5 w-5" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-foreground" data-testid={`text-bot-name-${bot.id}`}>
                                    {bot.name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {bot.runtime}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <BotStatusBadge status={bot.status as "running" | "stopped" | "error"} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground" data-testid={`text-uptime-${bot.id}`}>
                              {bot.status === "running" ? formatUptime(bot.uptime || 0) : "--"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground" data-testid={`text-cpu-${bot.id}`}>
                              {bot.status === "running" ? `${bot.cpuUsage || 0}%` : "0%"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground" data-testid={`text-memory-${bot.id}`}>
                              {bot.status === "running" ? `${bot.memoryUsage || 0}MB` : "--"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                {bot.status === "running" ? (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => restartBotMutation.mutate(bot.id)}
                                      disabled={restartBotMutation.isPending}
                                      className="text-primary hover:text-primary/80"
                                      data-testid={`button-restart-${bot.id}`}
                                    >
                                      <RotateCcw className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => stopBotMutation.mutate(bot.id)}
                                      disabled={stopBotMutation.isPending}
                                      className="text-yellow-400 hover:text-yellow-300"
                                      data-testid={`button-stop-${bot.id}`}
                                    >
                                      <Square className="h-4 w-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => startBotMutation.mutate(bot.id)}
                                    disabled={startBotMutation.isPending}
                                    className="text-green-400 hover:text-green-300"
                                    data-testid={`button-start-${bot.id}`}
                                  >
                                    <Play className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-muted-foreground hover:text-foreground"
                                  data-testid={`button-settings-${bot.id}`}
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteBotMutation.mutate(bot.id)}
                                  disabled={deleteBotMutation.isPending}
                                  className="text-muted-foreground hover:text-destructive"
                                  data-testid={`button-delete-${bot.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
