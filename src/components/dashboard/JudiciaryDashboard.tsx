import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { NyaySutraSidebar } from "./NyaySutraSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { VitalStatsCards } from "./VitalStatsCards";
import { LiveCauseList, CauseListItem } from "./LiveCauseList";
import { JudgmentQueue, JudgmentItem } from "./JudgmentQueue";
import { QuickJudicialNotes } from "./QuickJudicialNotes";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Transform database cases to CauseListItem format
const transformCaseToCauseListItem = (
  dbCase: {
    id: string;
    case_number: string;
    title: string;
    status: string;
    next_hearing_date: string | null;
    priority: string | null;
  },
  index: number
): CauseListItem => {
  const getCaseType = (title: string): string => {
    if (title.toLowerCase().includes("writ")) return "Writ Petition";
    if (title.toLowerCase().includes("bail")) return "Bail Application";
    if (title.toLowerCase().includes("civil")) return "Civil Suit";
    if (title.toLowerCase().includes("criminal")) return "Criminal Appeal";
    return "Miscellaneous";
  };

  const getStage = (status: string): string => {
    switch (status) {
      case "pending": return "Filing";
      case "active": return "Arguments";
      case "hearing": return "Hearing";
      case "verdict_pending": return "Reserved";
      default: return "Scheduled";
    }
  };

  const mapStatus = (status: string): "scheduled" | "in-progress" | "completed" | "adjourned" => {
    switch (status) {
      case "closed": return "completed";
      case "hearing": return "in-progress";
      case "appealed": return "adjourned";
      default: return "scheduled";
    }
  };

  return {
    id: dbCase.id,
    srNo: index + 1,
    caseNumber: dbCase.case_number,
    parties: dbCase.title,
    caseType: getCaseType(dbCase.title),
    stage: getStage(dbCase.status),
    status: mapStatus(dbCase.status),
    time: dbCase.next_hearing_date ? new Date(dbCase.next_hearing_date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : undefined,
    isUrgent: dbCase.priority === "urgent",
  };
};

// Mock data for judgment queue (this would come from DB in production)
const mockJudgmentQueue: JudgmentItem[] = [
  {
    id: "j1",
    caseNumber: "WP/0789/2024",
    parties: "Sunrise Pharma vs. DPCO",
    hearingDate: "Dec 28, 2024",
    draftProgress: 75,
    dueDate: "Jan 15, 2025",
  },
  {
    id: "j2",
    caseNumber: "CS/1567/2024",
    parties: "Metro Builders vs. NHAI",
    hearingDate: "Dec 20, 2024",
    draftProgress: 40,
    dueDate: "Jan 10, 2025",
    isOverdue: true,
  },
  {
    id: "j3",
    caseNumber: "CRL/0234/2024",
    parties: "State vs. Ramesh Gupta",
    hearingDate: "Jan 02, 2025",
    draftProgress: 15,
    dueDate: "Jan 20, 2025",
  },
  {
    id: "j4",
    caseNumber: "WP/1890/2024",
    parties: "Teachers Association vs. State",
    hearingDate: "Dec 15, 2024",
    draftProgress: 90,
    dueDate: "Jan 05, 2025",
  },
];

export const JudiciaryDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [currentHearingId, setCurrentHearingId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [causeList, setCauseList] = useState<CauseListItem[]>([]);
  const [, setIsLoading] = useState(true);

  const judgeName = profile?.full_name || "Shubham Patel";

  // Fetch real cases from database
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const { data: cases, error } = await supabase
          .from("cases")
          .select("id, case_number, title, status, next_hearing_date, priority")
          .order("next_hearing_date", { ascending: true })
          .limit(20);

        if (error) throw error;

        if (cases) {
          const transformedCases = cases.map((c, index) => transformCaseToCauseListItem(c, index));
          setCauseList(transformedCases);
        }
      } catch (error) {
        console.error("Error fetching cases:", error);
        toast.error("Failed to load cases");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCases();
  }, []);

  const currentCase = causeList.find((c) => c.id === currentHearingId);

  const handleStartHearing = useCallback((id: string) => {
    setCurrentHearingId(id);
    const caseItem = causeList.find((c) => c.id === id);
    toast.success(`Hearing started for ${caseItem?.caseNumber}`, {
      description: caseItem?.parties,
    });
  }, [causeList]);

  const handleOpenCaseFile = useCallback((id: string) => {
    navigate(`/cases/${id}`);
  }, [navigate]);

  const handleVideoCall = useCallback(() => {
    toast.info("Initiating video conference...", {
      description: "Connecting to virtual courtroom",
    });
  }, []);

  const handlePassOrder = useCallback((id: string) => {
    const caseItem = causeList.find((c) => c.id === id);
    toast.success(`Order passed for ${caseItem?.caseNumber}`);
    setCurrentHearingId(null);
    setNotes("");
  }, [causeList]);

  const handleOpenJudgment = useCallback((_id: string) => {
    toast.info("Judgment Writer - Coming Soon", {
      description: "This feature is under development",
    });
  }, []);

  const handleSaveNotes = useCallback((newNotes: string) => {
    setNotes(newNotes);
    // In production, this would save to database
  }, []);

  return (
    <div className="min-h-screen bg-background flex">
      <NyaySutraSidebar />

      <main className="flex-1 ml-64 transition-all duration-300">
        <DashboardHeader
          judgeName={judgeName}
          designation="Honorable Justice"
          notificationCount={5}
        />

        <div className="p-6 space-y-6">
          {/* Vital Stats */}
          <section>
            <VitalStatsCards
              casesListedToday={24}
              urgentApplications={5}
              judgmentsReserved={8}
              monthlyDisposalRate="+12%"
            />
          </section>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Cause List - 60% */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-3"
            >
              <LiveCauseList
                items={causeList}
                currentHearingId={currentHearingId}
                onStartHearing={handleStartHearing}
                onOpenCaseFile={handleOpenCaseFile}
                onVideoCall={handleVideoCall}
                onPassOrder={handlePassOrder}
              />
            </motion.div>

            {/* Right Column - 40% */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <JudgmentQueue
                  items={mockJudgmentQueue}
                  onOpenJudgment={handleOpenJudgment}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <QuickJudicialNotes
                  currentHearingId={currentHearingId}
                  currentCaseNumber={currentCase?.caseNumber}
                  initialNotes={notes}
                  onSaveNotes={handleSaveNotes}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
