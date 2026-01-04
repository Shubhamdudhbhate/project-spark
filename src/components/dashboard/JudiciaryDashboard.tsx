import { useState, useCallback } from "react";
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

// Mock data for demonstration
const mockCauseList: CauseListItem[] = [
  {
    id: "1",
    srNo: 1,
    caseNumber: "WP/1024/2025",
    parties: "State of Maharashtra vs. Sharma Industries Pvt. Ltd.",
    caseType: "Writ Petition",
    stage: "Arguments",
    status: "scheduled",
    time: "10:30 AM",
  },
  {
    id: "2",
    srNo: 2,
    caseNumber: "BA/0542/2025",
    parties: "Rajesh Kumar vs. State of Gujarat",
    caseType: "Bail Application",
    stage: "Hearing",
    status: "scheduled",
    isUrgent: true,
    time: "11:00 AM",
  },
  {
    id: "3",
    srNo: 3,
    caseNumber: "CS/2187/2024",
    parties: "Aarav Tech Solutions vs. Nexus Innovations",
    caseType: "Civil Suit",
    stage: "Evidence",
    status: "scheduled",
    time: "11:30 AM",
  },
  {
    id: "4",
    srNo: 4,
    caseNumber: "CRL/0891/2025",
    parties: "State vs. Mehta & Associates",
    caseType: "Criminal Appeal",
    stage: "Final Arguments",
    status: "scheduled",
    time: "12:00 PM",
  },
  {
    id: "5",
    srNo: 5,
    caseNumber: "WP/2045/2024",
    parties: "Environmental Action Forum vs. Union of India",
    caseType: "PIL",
    stage: "Directions",
    status: "scheduled",
    isUrgent: true,
    time: "02:00 PM",
  },
  {
    id: "6",
    srNo: 6,
    caseNumber: "MA/0123/2025",
    parties: "Priya Enterprises vs. State Bank of India",
    caseType: "Misc. Application",
    stage: "Consideration",
    status: "scheduled",
    time: "02:30 PM",
  },
];

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

  const judgeName = profile?.full_name || "Shubham Patel";

  const currentCase = mockCauseList.find((c) => c.id === currentHearingId);

  const handleStartHearing = useCallback((id: string) => {
    setCurrentHearingId(id);
    const caseItem = mockCauseList.find((c) => c.id === id);
    toast.success(`Hearing started for ${caseItem?.caseNumber}`, {
      description: caseItem?.parties,
    });
  }, []);

  const handleOpenCaseFile = useCallback((id: string) => {
    navigate(`/cases/${id}`);
  }, [navigate]);

  const handleVideoCall = useCallback(() => {
    toast.info("Initiating video conference...", {
      description: "Connecting to virtual courtroom",
    });
  }, []);

  const handlePassOrder = useCallback((id: string) => {
    const caseItem = mockCauseList.find((c) => c.id === id);
    toast.success(`Order passed for ${caseItem?.caseNumber}`);
    setCurrentHearingId(null);
    setNotes("");
  }, []);

  const handleOpenJudgment = useCallback((id: string) => {
    navigate(`/judgment/${id}`);
  }, [navigate]);

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
                items={mockCauseList}
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
