import { motion } from "framer-motion";
import { Calendar, AlertTriangle, FileText, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCard {
  id: string;
  label: string;
  value: number | string;
  icon: React.ElementType;
  trend?: {
    value: string;
    direction: "up" | "down";
  };
  variant: "default" | "urgent" | "success" | "warning";
}

interface VitalStatsCardsProps {
  casesListedToday: number;
  urgentApplications: number;
  judgmentsReserved: number;
  monthlyDisposalRate: string;
}

export const VitalStatsCards = ({
  casesListedToday,
  urgentApplications,
  judgmentsReserved,
  monthlyDisposalRate,
}: VitalStatsCardsProps) => {
  const stats: StatCard[] = [
    {
      id: "cases-today",
      label: "Cases Listed Today",
      value: casesListedToday,
      icon: Calendar,
      variant: "default",
    },
    {
      id: "urgent",
      label: "Urgent Applications",
      value: urgentApplications,
      icon: AlertTriangle,
      variant: "urgent",
    },
    {
      id: "reserved",
      label: "Judgments Reserved",
      value: judgmentsReserved,
      icon: FileText,
      variant: "warning",
    },
    {
      id: "disposal",
      label: "Monthly Disposal Rate",
      value: monthlyDisposalRate,
      icon: TrendingUp,
      trend: { value: "+12%", direction: "up" },
      variant: "success",
    },
  ];

  const getVariantStyles = (variant: StatCard["variant"]) => {
    switch (variant) {
      case "urgent":
        return {
          iconBg: "bg-urgent/10",
          iconColor: "text-urgent",
          borderColor: "border-urgent/20",
        };
      case "success":
        return {
          iconBg: "bg-success/10",
          iconColor: "text-success",
          borderColor: "border-success/20",
        };
      case "warning":
        return {
          iconBg: "bg-warning/10",
          iconColor: "text-warning",
          borderColor: "border-warning/20",
        };
      default:
        return {
          iconBg: "bg-primary/10",
          iconColor: "text-primary",
          borderColor: "border-primary/20",
        };
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const styles = getVariantStyles(stat.variant);
        const Icon = stat.icon;

        return (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className={cn("stat-card border", styles.borderColor)}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className={cn("p-2.5 rounded-xl", styles.iconBg)}>
                    <Icon className={cn("h-5 w-5", styles.iconColor)} />
                  </div>
                  {stat.trend && (
                    <div
                      className={cn(
                        "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                        stat.trend.direction === "up"
                          ? "bg-success/10 text-success"
                          : "bg-destructive/10 text-destructive"
                      )}
                    >
                      {stat.trend.direction === "up" ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {stat.trend.value}
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <p
                    className={cn(
                      "text-3xl font-bold tracking-tight",
                      stat.variant === "urgent" && "text-urgent"
                    )}
                  >
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};
