import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Lock,
  Upload,
  Eye,
  PenTool,
  Shield,
  User,
  Clock,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";

interface ChainOfCustodyModalProps {
  isOpen: boolean;
  onClose: () => void;
  evidenceId: string;
  evidenceTitle: string;
}

type AuditLogEntry = {
  id: string;
  action: string;
  performed_by: string;
  created_at: string | null;
  details: Record<string, unknown> | null;
  performer_name?: string;
};

const getActionIcon = (action: string) => {
  const lowered = action.toLowerCase();
  if (lowered.includes("upload")) return Upload;
  if (lowered.includes("view") || lowered.includes("access")) return Eye;
  if (lowered.includes("sign") || lowered.includes("approve")) return PenTool;
  if (lowered.includes("seal") || lowered.includes("lock")) return Shield;
  return FileText;
};

const getActionColor = (action: string) => {
  const lowered = action.toLowerCase();
  if (lowered.includes("upload")) return "text-blue-400 bg-blue-500/10 border-blue-500/20";
  if (lowered.includes("view") || lowered.includes("access")) return "text-slate-400 bg-slate-500/10 border-slate-500/20";
  if (lowered.includes("sign") || lowered.includes("approve")) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
  if (lowered.includes("seal") || lowered.includes("lock")) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  return "text-muted-foreground bg-muted/10 border-muted/20";
};

export const ChainOfCustodyModal = ({
  isOpen,
  onClose,
  evidenceId,
  evidenceTitle,
}: ChainOfCustodyModalProps) => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !evidenceId) return;

    const fetchAuditLogs = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("chain_of_custody")
        .select(`
          id,
          action,
          performed_by,
          created_at,
          details
        `)
        .eq("evidence_id", evidenceId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching audit logs:", error);
        setAuditLogs([]);
      } else {
        // Fetch performer names
        const performerIds = [...new Set((data || []).map((d) => d.performed_by))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", performerIds);

        const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]) || []);

        setAuditLogs(
          (data || []).map((log) => ({
            ...log,
            details: log.details as Record<string, unknown> | null,
            performer_name: profileMap.get(log.performed_by) || "Unknown User",
          }))
        );
      }
      setIsLoading(false);
    };

    fetchAuditLogs();
  }, [isOpen, evidenceId]);

  const formatTimestamp = (ts: string | null) => {
    if (!ts) return "Unknown time";
    return new Date(ts).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden bg-card border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="text-lg">Chain of Custody</span>
              <p className="text-sm font-normal text-muted-foreground mt-0.5">
                {evidenceTitle}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[60vh] pr-2 -mr-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size={32} />
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No audit trail available</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[23px] top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-primary/20 to-transparent" />

              <div className="space-y-4">
                {auditLogs.map((log, index) => {
                  const Icon = getActionIcon(log.action);
                  const colorClass = getActionColor(log.action);

                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="relative flex gap-4"
                    >
                      {/* Icon */}
                      <div
                        className={cn(
                          "relative z-10 p-2 rounded-lg border flex-shrink-0",
                          colorClass
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Badge variant="outline" className={cn("text-xs mb-2", colorClass)}>
                              {log.action}
                            </Badge>
                            <div className="flex items-center gap-2 text-sm">
                              <User className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="font-medium">{log.performer_name}</span>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatTimestamp(log.created_at)}
                          </span>
                        </div>

                        {/* Details */}
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="mt-2 p-2 rounded bg-secondary/30 border border-white/5">
                            {Object.entries(log.details).map(([key, value]) => (
                              <div key={key} className="flex items-center gap-2 text-xs">
                                <span className="text-muted-foreground capitalize">
                                  {key.replace(/_/g, " ")}:
                                </span>
                                <span className="font-mono text-foreground/80">
                                  {typeof value === "string" && value.length > 40
                                    ? `${value.slice(0, 20)}...${value.slice(-10)}`
                                    : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Tamper-proof notice */}
        <div className="mt-4 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <Shield className="w-4 h-4" />
            <span>This audit trail is cryptographically secured and tamper-proof</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
