import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Bot,
  Cog,
  HelpCircle,
  Store,
  Gauge,
  Upload,
} from "lucide-react";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: Gauge, current: false },
  { name: "My Bots", href: "/dashboard", icon: Bot, count: 0 },
  { name: "Upload Bot", href: "/upload", icon: Upload },
  { name: "Gallery", href: "/gallery", icon: Store },
  { name: "Analytics", href: "/dashboard", icon: BarChart3 },
];

const secondaryNavigation = [
  { name: "Settings", href: "#settings", icon: Cog },
  { name: "Support", href: "#support", icon: HelpCircle },
];

interface SidebarProps {
  botCount: number;
}

export function Sidebar({ botCount }: SidebarProps) {
  const [location] = useLocation();

  return (
    <aside className="w-64 min-h-screen bg-card border-r border-border hidden lg:block">
      <div className="p-6">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                  data-testid={`nav-${item.name.toLowerCase().replace(" ", "-")}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                  {item.name === "My Bots" && (
                    <span className="ml-auto bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full" data-testid="text-bot-count">
                      {botCount}
                    </span>
                  )}
                </a>
              </Link>
            );
          })}
          <div className="pt-4 border-t border-border mt-4">
            {secondaryNavigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <a
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  data-testid={`nav-${item.name.toLowerCase()}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </a>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </aside>
  );
}
