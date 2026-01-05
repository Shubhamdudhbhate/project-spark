import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Activity,
  Server,
  Database,
  Cloud,
  Shield,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  HardDrive,
  Cpu,
  MemoryStick,
  Globe,
  Lock,
  Zap,
} from "lucide-react";
import { NyaySutraSidebar } from "@/components/dashboard/NyaySutraSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ServiceStatus {
  id: string;
  name: string;
  status: "operational" | "degraded" | "down";
  latency: number;
  uptime: number;
  lastChecked: Date;
  icon: React.ElementType;
}

interface SystemLog {
  id: string;
  type: "info" | "warning" | "error";
  message: string;
  timestamp: Date;
  component: string;
}

const SystemHealth = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const [services] = useState<ServiceStatus[]>([
    { id: "1", name: "Authentication Server", status: "operational", latency: 45, uptime: 99.99, lastChecked: new Date(), icon: Lock },
    { id: "2", name: "Database Cluster", status: "operational", latency: 12, uptime: 99.95, lastChecked: new Date(), icon: Database },
    { id: "3", name: "File Storage", status: "operational", latency: 89, uptime: 99.98, lastChecked: new Date(), icon: HardDrive },
    { id: "4", name: "API Gateway", status: "operational", latency: 23, uptime: 99.97, lastChecked: new Date(), icon: Globe },
    { id: "5", name: "Video Conference", status: "degraded", latency: 156, uptime: 98.5, lastChecked: new Date(), icon: Cloud },
    { id: "6", name: "Notification Service", status: "operational", latency: 34, uptime: 99.9, lastChecked: new Date(), icon: Zap },
  ]);

  const [systemLogs] = useState<SystemLog[]>([
    { id: "1", type: "info", message: "Daily backup completed successfully", timestamp: new Date(), component: "Backup Service" },
    { id: "2", type: "warning", message: "High latency detected on video service", timestamp: new Date(Date.now() - 300000), component: "Video Conference" },
    { id: "3", type: "info", message: "SSL certificates renewed", timestamp: new Date(Date.now() - 600000), component: "Security" },
    { id: "4", type: "info", message: "Database optimization completed", timestamp: new Date(Date.now() - 900000), component: "Database" },
    { id: "5", type: "error", message: "Failed login attempt blocked", timestamp: new Date(Date.now() - 1200000), component: "Authentication" },
    { id: "6", type: "info", message: "Cache cleared successfully", timestamp: new Date(Date.now() - 1500000), component: "Cache Service" },
  ]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setLastRefresh(new Date());
    setIsRefreshing(false);
  };

  const getStatusIcon = (status: ServiceStatus["status"]) => {
    switch (status) {
      case "operational":
        return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
      case "degraded":
        return <AlertTriangle className="h-5 w-5 text-amber-400" />;
      case "down":
        return <XCircle className="h-5 w-5 text-red-400" />;
    }
  };

  const getStatusBadge = (status: ServiceStatus["status"]) => {
    switch (status) {
      case "operational":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Operational</Badge>;
      case "degraded":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Degraded</Badge>;
      case "down":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Down</Badge>;
    }
  };

  const getLogIcon = (type: SystemLog["type"]) => {
    switch (type) {
      case "info":
        return <CheckCircle2 className="h-4 w-4 text-blue-400" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-400" />;
    }
  };

  const overallHealth = services.filter((s) => s.status === "operational").length / services.length * 100;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <NyaySutraSidebar />

      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary" />
              System Health
            </h1>
            <p className="text-muted-foreground mt-1">Monitor system performance and service status</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Last updated: {format(lastRefresh, "hh:mm:ss a")}
            </span>
            <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Overall Status */}
        <Card className="card-glass border-border/50 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div
                  className={cn(
                    "p-4 rounded-2xl",
                    overallHealth >= 90
                      ? "bg-emerald-500/10"
                      : overallHealth >= 70
                      ? "bg-amber-500/10"
                      : "bg-red-500/10"
                  )}
                >
                  <Shield
                    className={cn(
                      "h-10 w-10",
                      overallHealth >= 90
                        ? "text-emerald-400"
                        : overallHealth >= 70
                        ? "text-amber-400"
                        : "text-red-400"
                    )}
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {overallHealth >= 90
                      ? "All Systems Operational"
                      : overallHealth >= 70
                      ? "Some Systems Degraded"
                      : "System Issues Detected"}
                  </h2>
                  <p className="text-muted-foreground">
                    {services.filter((s) => s.status === "operational").length} of {services.length} services operational
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-foreground">{overallHealth.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Overall Health</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-12 gap-6">
          {/* Services Grid */}
          <div className="col-span-8">
            <Card className="card-glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-primary" />
                  Service Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {services.map((service) => {
                    const Icon = service.icon;
                    return (
                      <motion.div
                        key={service.id}
                        whileHover={{ scale: 1.01 }}
                        className={cn(
                          "p-4 rounded-xl border transition-all",
                          service.status === "operational"
                            ? "bg-muted/20 border-border/50"
                            : service.status === "degraded"
                            ? "bg-amber-500/5 border-amber-500/20"
                            : "bg-red-500/5 border-red-500/20"
                        )}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted/50">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{service.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Latency: {service.latency}ms
                              </p>
                            </div>
                          </div>
                          {getStatusIcon(service.status)}
                        </div>
                        <div className="flex items-center justify-between">
                          {getStatusBadge(service.status)}
                          <span className="text-xs text-muted-foreground">
                            Uptime: {service.uptime}%
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Resource Usage */}
            <Card className="card-glass border-border/50 mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-primary" />
                  Resource Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-blue-400" />
                        CPU
                      </span>
                      <span className="text-sm font-medium">34%</span>
                    </div>
                    <Progress value={34} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm flex items-center gap-2">
                        <MemoryStick className="h-4 w-4 text-purple-400" />
                        Memory
                      </span>
                      <span className="text-sm font-medium">62%</span>
                    </div>
                    <Progress value={62} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-emerald-400" />
                        Storage
                      </span>
                      <span className="text-sm font-medium">48%</span>
                    </div>
                    <Progress value={48} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Logs Panel */}
          <div className="col-span-4">
            <Card className="card-glass border-border/50 h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Recent Logs
                  </span>
                  <Badge variant="outline">{systemLogs.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-3">
                    {systemLogs.map((log) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                          "p-3 rounded-lg border",
                          log.type === "error"
                            ? "bg-red-500/5 border-red-500/20"
                            : log.type === "warning"
                            ? "bg-amber-500/5 border-amber-500/20"
                            : "bg-muted/20 border-border/50"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {getLogIcon(log.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">{log.message}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs px-1.5 py-0">
                                {log.component}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(log.timestamp, "hh:mm a")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SystemHealth;
