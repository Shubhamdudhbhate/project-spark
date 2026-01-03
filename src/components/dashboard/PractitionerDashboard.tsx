import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Scale,
  Upload,
  FileText,
  Calendar,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { GlassCard } from "@/components/layout/GlassWrapper";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";

type Case = {
  id: string;
  case_number: string;
  title: string;
  status: string;
  filing_date: string;
  next_hearing_date: string | null;
};

type UploadStatus = {
  caseId: string;
  caseTitle: string;
  fileName: string;
  status: "hashing" | "encrypting" | "ipfs" | "blockchain" | "complete";
  progress: number;
};

export const PractitionerDashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { roleTheme } = useRole();
  const [cases, setCases] = useState<Case[]>([]);
  const [upcomingHearings, setUpcomingHearings] = useState<Case[]>([]);
  const [uploadTrackers] = useState<UploadStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchData();
    }
  }, [profile?.id]);

  const fetchData = async () => {
    if (!profile?.id) return;

    try {
      // Fetch cases where user is clerk
      const { data: casesData } = await supabase
        .from("cases")
        .select("*")
        .eq("clerk_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(10);

      setCases(casesData || []);

      // Fetch upcoming hearings (next 7 days)
      const today = new Date();
      const nextWeek = addDays(today, 7);

      const { data: hearingsData } = await supabase
        .from("cases")
        .select("*")
        .eq("clerk_id", profile.id)
        .not("next_hearing_date", "is", null)
        .gte("next_hearing_date", today.toISOString())
        .lte("next_hearing_date", nextWeek.toISOString())
        .order("next_hearing_date", { ascending: true });

      setUpcomingHearings(hearingsData || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    );
  }

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
            <Scale className={cn("w-8 h-8", `text-${roleTheme.primary}`)} />
            Practitioner Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your cases and evidence uploads
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Tracker */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Upload className={cn("w-5 h-5", `text-${roleTheme.primary}`)} />
              Upload Tracker
            </h3>
          </div>

          {uploadTrackers.length === 0 ? (
            <div className="text-center py-8">
              <Upload className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">
                No active uploads
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/courts")}
              >
                Start Upload
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {uploadTrackers.map((tracker, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 rounded-lg bg-secondary/30 border border-white/5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{tracker.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {tracker.caseTitle}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {tracker.status}
                    </Badge>
                  </div>
                  <Progress value={tracker.progress} className="h-2" />
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>
                      {tracker.status === "hashing" && "Generating hash..."}
                      {tracker.status === "encrypting" && "Encrypting file..."}
                      {tracker.status === "ipfs" && "Uploading to IPFS..."}
                      {tracker.status === "blockchain" &&
                        "Recording on blockchain..."}
                      {tracker.status === "complete" && "Upload complete!"}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Upcoming Deadlines */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className={cn("w-5 h-5", `text-${roleTheme.primary}`)} />
              Upcoming Hearings
            </h3>
          </div>

          {upcomingHearings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No upcoming hearings
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingHearings.map((hearing) => (
                <motion.button
                  key={hearing.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => navigate(`/cases/${hearing.id}`)}
                  className="w-full p-3 rounded-lg bg-secondary/30 border border-white/5 hover:border-white/10 transition-all text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm group-hover:text-primary transition-colors">
                        {hearing.title}
                      </p>
                      <p className="text-xs font-mono text-muted-foreground mt-1">
                        {hearing.case_number}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium">
                        {hearing.next_hearing_date
                          ? format(
                              new Date(hearing.next_hearing_date),
                              "MMM dd"
                            )
                          : "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {hearing.next_hearing_date
                          ? format(
                              new Date(hearing.next_hearing_date),
                              "hh:mm a"
                            )
                          : ""}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* My Cases */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className={cn("w-5 h-5", `text-${roleTheme.primary}`)} />
            My Cases
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/courts")}
          >
            View All
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {cases.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              No cases assigned yet
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/courts")}
            >
              Browse Courts
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cases.slice(0, 6).map((caseItem) => (
              <motion.button
                key={caseItem.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => navigate(`/cases/${caseItem.id}`)}
                className="p-4 rounded-lg bg-secondary/30 border border-white/5 hover:border-white/10 transition-all text-left group"
              >
                <div className="flex items-start justify-between mb-2">
                  <FileText className={cn("w-5 h-5", `text-${roleTheme.primary}/50`)} />
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      caseItem.status === "active"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    )}
                  >
                    {caseItem.status}
                  </Badge>
                </div>
                <p className="font-medium text-sm group-hover:text-primary transition-colors mb-1">
                  {caseItem.title}
                </p>
                <p className="text-xs font-mono text-muted-foreground">
                  {caseItem.case_number}
                </p>
              </motion.button>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
};

