import { Bot } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { BotStatusBadge } from "./bot-status-badge";
import { Button } from "@/components/ui/button";
import { Bot as BotIcon, User, Server } from "lucide-react";

interface BotCardProps {
  bot: Bot & { author?: string; servers?: string };
  isPublic?: boolean;
  onViewDetails?: () => void;
}

export function BotCard({ bot, isPublic = false, onViewDetails }: BotCardProps) {
  const getCategoryColor = (category?: string) => {
    const colors = {
      Music: "bg-purple-500/20 text-purple-400",
      Moderation: "bg-blue-500/20 text-blue-400",
      Games: "bg-green-500/20 text-green-400",
      Utility: "bg-yellow-500/20 text-yellow-400",
    };
    return colors[category as keyof typeof colors] || "bg-gray-500/20 text-gray-400";
  };

  const getGradientForBot = (name: string) => {
    const gradients = [
      "from-purple-500 to-pink-500",
      "from-blue-500 to-cyan-500",
      "from-green-500 to-emerald-500",
      "from-yellow-500 to-orange-500",
      "from-red-500 to-pink-500",
      "from-indigo-500 to-purple-500",
    ];
    return gradients[name.length % gradients.length];
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`card-bot-${bot.id}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 bg-gradient-to-br ${getGradientForBot(bot.name)} rounded-lg flex items-center justify-center`}>
            <BotIcon className="text-white text-lg" />
          </div>
          <BotStatusBadge status={bot.status as "running" | "stopped" | "error"} />
        </div>
        
        <h3 className="text-lg font-semibold text-foreground mb-2" data-testid={`text-bot-name-${bot.id}`}>
          {bot.name}
        </h3>
        
        <p className="text-muted-foreground text-sm mb-4" data-testid={`text-bot-description-${bot.id}`}>
          {bot.description || "No description provided"}
        </p>
        
        {isPublic && (
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <span className="flex items-center">
              <User className="w-4 h-4 mr-1" />
              by @{bot.author || "unknown"}
            </span>
            <span className="flex items-center">
              <Server className="w-4 h-4 mr-1" />
              {bot.servers || "0"} servers
            </span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {bot.category && (
              <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(bot.category)}`}>
                {bot.category}
              </span>
            )}
            <span className="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded">
              {bot.runtime}
            </span>
          </div>
          
          {onViewDetails && (
            <Button 
              variant="link" 
              className="p-0 h-auto font-medium text-primary hover:text-primary/80"
              onClick={onViewDetails}
              data-testid={`button-view-details-${bot.id}`}
            >
              View Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
