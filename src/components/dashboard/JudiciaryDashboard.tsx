import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Gavel,
  FileText,
  AlertCircle,
  CheckCircle2,
  Play,
  Timer,
  ArrowRight,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/layout/GlassWrapper";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { JudgeDashboardCasesList } from "./JudgeDashboardCasesList";

type Case = {
  id: string;
  case_number: string;
  title: string;
  status: string;
  filing_date: string;
  next_hearing_date: string | null;
};

type PermissionRequest = {
  id: string;
  case_id: string;
  requester_id: string;
  requester_name: string;
  requested_at: string;
  case_title: string;
  case_number: string;
};

export const JudiciaryDashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { roleTheme } = useRole();
  const [cases, setCases] = useState<Case[]>([]);
  const [permissionRequests, setPermissionRequests] = useState<PermissionRequest[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchData();
    }
  }, [profile?.id]);

  const fetchData = async () => {
    if (!profile?.id) return;

    try {
      // Fetch cases where user is judge
      const { data: casesData } = await supabase
        .from("cases")
        .select("*")
        .eq("judge_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(10);

      setCases(casesData || []);

      // Fetch active sessions
      const { data: sessionsData } = await supabase
        .from("session_logs")
        .select("*, cases(title, case_number)")
        .eq("judge_id", profile.id)
        .eq("status", "active")
        .order("started_at", { ascending: false });

      setActiveSessions(sessionsData || []);

      // Fetch pending permission requests
      const { data: permissionsData } = await supabase
        .from("permission_requests")
        .select(
          `
          *,
          cases(title, case_number),
          profiles!permission_requests_requester_id_fkey(full_name)
        `
        )
        .eq("status", "pending")
        .order("requested_at", { ascending: false });

      const formattedPermissions: PermissionRequest[] =
        permissionsData?.map((p: any) => ({
          id: p.id,
          case_id: p.case_id,
          requester_id: p.requester_id,
          requester_name: p.profiles?.full_name || "Unknown",
          requested_at: p.requested_at,
          case_title: p.cases?.title || "Unknown Case",
          case_number: p.cases?.case_number || "N/A",
        })) || [];

      setPermissionRequests(formattedPermissions);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrantPermission = async (requestId: string) => {
    if (!profile?.id) return;

    const { error } = await supabase
      .from("permission_requests")
      .update({
        status: "granted",
        responded_at: new Date().toISOString(),
        responded_by: profile.id,
      })
      .eq("id", requestId);

    if (error) {
      toast.error("Failed to grant permission");
    } else {
      toast.success("Permission granted");
      fetchData();
    }
  };

  const handleDenyPermission = async (requestId: string) => {
    if (!profile?.id) return;

    const { error } = await supabase
      .from("permission_requests")
      .update({
        status: "denied",
        responded_at: new Date().toISOString(),
        responded_by: profile.id,
      })
      .eq("id", requestId);

    if (error) {
      toast.error("Failed to deny permission");
    } else {
      toast.success("Permission denied");
      fetchData();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your bench...</p>
        </div>
      </div>
    );
  }

  const activeSession = activeSessions[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Gavel className={cn("w-8 h-8", `text-${roleTheme.primary}`)} />
            Judiciary Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your cases and court sessions
          </p>
        </div>
      </motion.div>

      {/* Live Bench - Active Session Card */}
      {activeSession && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <GlassCard
            className={cn(
              "p-6 border-2",
              `border-${roleTheme.border}`,
              "relative overflow-hidden"
            )}
          >
            {/* Pulsing glow effect */}
            <div
              className={cn(
                "absolute inset-0 rounded-2xl opacity-20 animate-pulse",
                `bg-${roleTheme.glow}`
              )}
            />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full animate-pulse",
                      `bg-${roleTheme.primary}`
                    )}
                  />
                  <h2 className="text-xl font-bold text-foreground">
                    Live Bench Session
                  </h2>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "border",
                    `border-${roleTheme.border}`,
                    `bg-${roleTheme.badge}`
                  )}
                >
                  <Timer className="w-3 h-3 mr-1" />
                  {formatDistanceToNow(new Date(activeSession.started_at), {
                    addSuffix: false,
                  })}
                </Badge>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Case</p>
                  <p className="font-semibold">
                    {activeSession.cases?.title || "Unknown Case"}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">
                    {activeSession.cases?.case_number || "N/A"}
                  </p>
                </div>

                <Button
                  onClick={() => navigate(`/cases/${activeSession.case_id}`)}
                  className={cn(
                    "w-full",
                    `bg-${roleTheme.primary} hover:opacity-90`
                  )}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Resume Session
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Permission Inbox */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertCircle className={cn("w-5 h-5", `text-${roleTheme.primary}`)} />
              Permission Inbox
            </h3>
            {permissionRequests.length > 0 && (
              <Badge variant="outline">{permissionRequests.length}</Badge>
            )}
          </div>

          {permissionRequests.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No pending permission requests
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {permissionRequests.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 rounded-lg bg-secondary/30 border border-white/5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{request.requester_name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {request.case_title}
                      </p>
                      <p className="text-xs font-mono text-muted-foreground">
                        {request.case_number}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(request.requested_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleGrantPermission(request.id)}
                      className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Grant
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDenyPermission(request.id)}
                      className="flex-1"
                    >
                      Deny
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Assigned Cases with Scheduling */}
        <JudgeDashboardCasesList cases={cases} onRefresh={fetchData} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Cases</p>
              <p className="text-2xl font-bold">{cases.length}</p>
            </div>
            <FileText className={cn("w-8 h-8", `text-${roleTheme.primary}/30`)} />
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Sessions</p>
              <p className="text-2xl font-bold">{activeSessions.length}</p>
            </div>
            <Play className={cn("w-8 h-8", `text-${roleTheme.primary}/30`)} />
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Requests</p>
              <p className="text-2xl font-bold">{permissionRequests.length}</p>
            </div>
            <AlertCircle className={cn("w-8 h-8", `text-${roleTheme.primary}/30`)} />
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Authority Level</p>
              <p className="text-2xl font-bold flex items-center gap-1">
                <Shield className={cn("w-5 h-5", `text-${roleTheme.primary}`)} />
                Judge
              </p>
            </div>
            <Gavel className={cn("w-8 h-8", `text-${roleTheme.primary}/30`)} />
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

