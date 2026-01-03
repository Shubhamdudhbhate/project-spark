import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  FileText,
  CheckCircle2,
  Clock,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/layout/GlassWrapper";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Case = {
  id: string;
  case_number: string;
  title: string;
  status: string;
  filing_date: string;
  plaintiff_id: string;
  defendant_id: string;
};

type CaseJourneyStep = {
  label: string;
  status: "completed" | "current" | "pending";
  date?: string;
};

export const PublicDashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { roleTheme } = useRole();
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchData();
    }
  }, [profile?.id]);

  const fetchData = async () => {
    if (!profile?.id) return;

    try {
      // Fetch cases where user is plaintiff or defendant
      const { data: casesData } = await supabase
        .from("cases")
        .select("*")
        .or(`plaintiff_id.eq.${profile.id},defendant_id.eq.${profile.id}`)
        .order("created_at", { ascending: false });

      setCases(casesData || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCaseJourney = (caseItem: Case): CaseJourneyStep[] => {
    const steps: CaseJourneyStep[] = [
      {
        label: "Filed",
        status: "completed",
        date: caseItem.filing_date,
      },
      {
        label: "Under Review",
        status:
          caseItem.status === "pending" || caseItem.status === "active"
            ? "current"
            : caseItem.status === "closed"
              ? "completed"
              : "pending",
      },
      {
        label: "Hearing",
        status: caseItem.status === "active" ? "current" : "pending",
      },
      {
        label: "Judgment",
        status: caseItem.status === "closed" ? "completed" : "pending",
      },
    ];
    return steps;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-500/30 border-t-slate-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your cases...</p>
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
            <Users className={cn("w-8 h-8", `text-${roleTheme.primary}`)} />
            Public Portal
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your case progress and view verified evidence
          </p>
        </div>
      </motion.div>

      {cases.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <FileText className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Cases Found</h3>
          <p className="text-muted-foreground mb-6">
            You don't have any cases associated with your account yet.
          </p>
          <Button variant="outline" onClick={() => navigate("/courts")}>
            Browse Courts
          </Button>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {cases.map((caseItem) => {
            const journey = getCaseJourney(caseItem);
            const isPlaintiff = caseItem.plaintiff_id === profile?.id;

            return (
              <motion.div
                key={caseItem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <GlassCard className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">
                          {caseItem.title}
                        </h3>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            caseItem.status === "active"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : caseItem.status === "closed"
                                ? "bg-slate-500/10 text-slate-400 border-slate-500/20"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          )}
                        >
                          {caseItem.status}
                        </Badge>
                      </div>
                      <p className="text-sm font-mono text-muted-foreground mb-1">
                        {caseItem.case_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isPlaintiff ? "Plaintiff" : "Defendant"}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/cases/${caseItem.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Case
                    </Button>
                  </div>

                  {/* Case Journey */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-muted-foreground">
                      Case Journey
                    </h4>
                    <div className="relative">
                      {/* Progress Line */}
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-secondary" />
                      <div
                        className={cn(
                          "absolute left-4 top-0 w-0.5 transition-all duration-500",
                          `bg-${roleTheme.primary}`
                        )}
                        style={{
                          height: `${
                            (journey.filter((s) => s.status === "completed")
                              .length /
                              (journey.length - 1)) *
                            100
                          }%`,
                        }}
                      />

                      {/* Steps */}
                      <div className="space-y-6 relative">
                        {journey.map((step, index) => (
                          <div key={index} className="flex items-start gap-4">
                            <div
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center border-2 relative z-10",
                                step.status === "completed"
                                  ? `bg-${roleTheme.primary} border-${roleTheme.primary}`
                                  : step.status === "current"
                                    ? `bg-${roleTheme.primary}/20 border-${roleTheme.primary}`
                                    : "bg-secondary border-white/10"
                              )}
                            >
                              {step.status === "completed" ? (
                                <CheckCircle2 className="w-4 h-4 text-white" />
                              ) : step.status === "current" ? (
                                <Clock className={cn("w-4 h-4", `text-${roleTheme.primary}`)} />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                              )}
                            </div>
                            <div className="flex-1 pt-1">
                              <p
                                className={cn(
                                  "text-sm font-medium",
                                  step.status === "completed" || step.status === "current"
                                    ? "text-foreground"
                                    : "text-muted-foreground"
                                )}
                              >
                                {step.label}
                              </p>
                              {step.date && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(step.date).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

