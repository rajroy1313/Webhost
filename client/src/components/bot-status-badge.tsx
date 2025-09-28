import { cn } from "@/lib/utils";

interface BotStatusBadgeProps {
  status: "running" | "stopped" | "error";
  className?: string;
}

export function BotStatusBadge({ status, className }: BotStatusBadgeProps) {
  const statusConfig = {
    running: {
      label: "Running",
      className: "bg-green-500/20 text-green-400",
      dotClassName: "bg-green-400",
    },
    stopped: {
      label: "Stopped",
      className: "bg-yellow-500/20 text-yellow-400",
      dotClassName: "bg-yellow-400",
    },
    error: {
      label: "Error",
      className: "bg-red-500/20 text-red-400",
      dotClassName: "bg-red-400",
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        config.className,
        className
      )}
      data-testid={`status-${status}`}
    >
      <span
        className={cn("w-1.5 h-1.5 rounded-full mr-1.5", config.dotClassName)}
      />
      {config.label}
    </span>
  );
}
