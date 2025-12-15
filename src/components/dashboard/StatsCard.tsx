import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: string;
  variant?: "blue" | "success" | "saffron";
  delay?: number;
}

export const StatsCard = ({
  icon: Icon,
  label,
  value,
  trend,
  variant = "blue",
  delay = 0,
}: StatsCardProps) => {
  const glowClass = {
    blue: "stat-glow-blue",
    success: "stat-glow-success",
    saffron: "stat-glow-saffron",
  };

  const iconBgClass = {
    blue: "bg-primary/10 border-primary/20",
    success: "bg-emerald-500/10 border-emerald-500/20",
    saffron: "bg-saffron/10 border-saffron/20",
  };

  const iconColorClass = {
    blue: "text-primary",
    success: "text-emerald-400",
    saffron: "text-saffron",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn("glass-card-hover p-6", glowClass[variant])}
    >
      <div className="flex items-start justify-between">
        <div className={cn("p-3 rounded-xl border", iconBgClass[variant])}>
          <Icon className={cn("w-6 h-6", iconColorClass[variant])} />
        </div>
        {trend && (
          <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      </div>
    </motion.div>
  );
};
