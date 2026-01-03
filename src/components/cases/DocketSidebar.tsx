import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Calendar,
  FileText,
  Users,
  History,
  ChevronRight,
  Circle,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface DiaryEntry {
  id: string;
  action: string;
  actor_id: string;
  actor_name?: string;
  details: unknown;
  created_at: string;
}

interface Party {
  id: string;
  name: string;
  role: string;
  isOnline?: boolean;
}

interface DocketSidebarProps {
  caseId: string;
  caseNumber: string;
  filingDate: string;
  status: string;
  parties: Party[];
}

const actionLabels: Record<string, string> = {
  SESSION_START: "started session",
  SESSION_END: "ended session",
  EVIDENCE_SEALED: "sealed evidence",
  EVIDENCE_UPLOADED: "uploaded evidence",
  CASE_CREATED: "created the case",
  STATUS_CHANGE: "changed case status",
  JUDGE_TRANSFER: "transferred case",
  UPLOADED: "uploaded file",
  SEALED: "sealed evidence",
};

export const DocketSidebar = ({
  caseId,
  caseNumber,
  filingDate,
  status,
  parties,
}: DocketSidebarProps) => {
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDiary = async () => {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("case_diary")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error fetching case diary:", error);
        setIsLoading(false);
        return;
      }

      // Fetch actor names
      const actorIds = [...new Set((data || []).map((e) => e.actor_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", actorIds);

      const profileMap = new Map(
        profiles?.map((p) => [p.id, p.full_name]) || []
      );

      setDiaryEntries(
        (data || []).map((e) => ({
          ...e,
          actor_name: profileMap.get(e.actor_id) || "Unknown",
        }))
      );
      setIsLoading(false);
    };

    fetchDiary();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`docket-diary-${caseId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "case_diary",
          filter: `case_id=eq.${caseId}`,
        },
        () => {
          fetchDiary();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [caseId]);

  const statusConfig: Record<string, { label: string; className: string }> = {
    active: {
      label: "Active",
      className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    },
    closed: {
      label: "Closed",
      className: "bg-muted text-muted-foreground border-border",
    },
    pending: {
      label: "Pending",
      className: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    },
    archived: {
      label: "Archived",
      className: "bg-muted text-muted-foreground border-border",
    },
  };

  const currentStatus = statusConfig[status] || statusConfig.pending;

  return (
    <div className="h-full border-l border-border bg-card">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Case Docket
        </h2>
      </div>

      <Accordion
        type="single"
        collapsible
        defaultValue="metadata"
        className="w-full"
      >
        {/* Case Metadata Section */}
        <AccordionItem value="metadata" className="border-b border-border">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-secondary/50">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="w-4 h-4 text-muted-foreground" />
              Case Metadata
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Case ID</span>
                <code className="text-xs font-mono bg-secondary px-2 py-1 rounded">
                  {caseNumber}
                </code>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  Filing Date
                </span>
                <span className="text-xs flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  {format(new Date(filingDate), "MMM dd, yyyy")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Status</span>
                <Badge
                  variant="outline"
                  className={cn("text-xs", currentStatus.className)}
                >
                  {currentStatus.label}
                </Badge>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Parties Involved Section */}
        <AccordionItem value="parties" className="border-b border-border">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-secondary/50">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="w-4 h-4 text-muted-foreground" />
              Parties Involved
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-2">
              {parties.map((party) => (
                <div
                  key={party.id}
                  className="flex items-center justify-between py-2 px-3 rounded-md bg-secondary/30"
                >
                  <div className="flex items-center gap-2">
                    <Circle
                      className={cn(
                        "w-2 h-2",
                        party.isOnline
                          ? "text-emerald-400 fill-emerald-400"
                          : "text-muted-foreground fill-muted-foreground"
                      )}
                    />
                    <span className="text-sm">{party.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {party.role}
                  </span>
                </div>
              ))}
              {parties.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No parties assigned
                </p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Case Diary & Logs Section */}
        <AccordionItem value="diary" className="border-b border-border">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-secondary/50">
            <div className="flex items-center gap-2 text-sm font-medium">
              <History className="w-4 h-4 text-muted-foreground" />
              Case Diary & Logs
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : diaryEntries.length > 0 ? (
              <div className="relative">
                {/* Vertical timeline line */}
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

                <div className="space-y-3">
                  {diaryEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex gap-3 items-start relative"
                    >
                      {/* Timeline dot */}
                      <div className="w-[15px] flex justify-center pt-1.5 relative z-10">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(entry.created_at), "h:mm a")}
                          </span>
                          <ChevronRight className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {entry.actor_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {actionLabels[entry.action] || entry.action.toLowerCase().replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(entry.created_at), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-6">
                No activity recorded yet
              </p>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
