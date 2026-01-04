import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarIcon,
  Clock,
  UserPlus,
  CheckCircle2,
  XCircle,
  History,
  AlertCircle,
  Upload,
  Users,
  Gavel,
  LogOut,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/layout/GlassWrapper";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type HearingStatus = "pending" | "scheduled";

type HearingHistoryEntry = {
  id: string;
  date: string;
  time: string;
  reason: string | null;
  status: "scheduled" | "postponed" | "completed";
  createdAt: string;
};

type AccessRequest = {
  requestId: string;
  requesterId: string;
  requesterName: string;
  role: "Clerk" | "Lawyer";
  message: string;
  requestedAt: string;
};

type AllottedMember = {
  id: string;
  requesterId: string;
  requesterName: string;
  role: "Clerk" | "Lawyer" | "Judge";
  canUpload: boolean;
  authorizedAt: string;
};

type JudgeProfile = {
  id: string;
  full_name: string;
  role_category: string;
};

interface JudgeSessionCaseManagerProps {
  caseId: string;
  caseName: string;
  caseNumber: string;
  currentJudgeId: string;
  onCaseTransferred?: () => void;
}

// ============================================================================
// INITIAL STATE WITH COMPREHENSIVE MOCK DATA
// ============================================================================

const generateMockData = (_caseId: string, _caseName: string, currentJudgeId: string) => {
  return {
    // Hearing Status
    hearingStatus: "scheduled" as HearingStatus,
    currentHearingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    currentHearingTime: "14:30",

    // Hearing History (Session History)
    hearingHistory: [
      {
        id: "hist-1",
        date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
        time: "10:00",
        reason: null,
        status: "completed" as const,
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "hist-2",
        date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
        time: "11:00",
        reason: "Witness unavailable due to medical emergency. Court granted adjournment.",
        status: "postponed" as const,
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "hist-3",
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        time: "14:00",
        reason: null,
        status: "completed" as const,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "hist-4",
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
        time: "15:30",
        reason: "Additional evidence submitted. Time needed for review by both parties.",
        status: "postponed" as const,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ] as HearingHistoryEntry[],

    // Pending Access Requests
    pendingAccessRequests: [
      {
        requestId: "req-001",
        requesterId: "user-clerk-123",
        requesterName: "Sarah Johnson",
        role: "Clerk" as const,
        message: "I am the court clerk assigned to this case and need access to manage case documents and maintain the case file.",
        requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      },
      {
        requestId: "req-002",
        requesterId: "user-lawyer-456",
        requesterName: "Michael Chen",
        role: "Lawyer" as const,
        message: "I am the defense attorney representing the defendant in this case. I need access to review evidence and submit defense documents.",
        requestedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      },
    ] as AccessRequest[],

    // Allotted Members (Case Team)
    allottedMembers: [
      {
        id: "auth-001",
        requesterId: currentJudgeId,
        requesterName: "Hon. Justice Robert Williams",
        role: "Judge" as const,
        canUpload: true,
        authorizedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "auth-002",
        requesterId: "user-lawyer-111",
        requesterName: "David Thompson",
        role: "Lawyer" as const,
        canUpload: true,
        authorizedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "auth-003",
        requesterId: "user-lawyer-222",
        requesterName: "Jennifer Martinez",
        role: "Lawyer" as const,
        canUpload: false,
        authorizedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "auth-004",
        requesterId: "user-clerk-999",
        requesterName: "James Wilson",
        role: "Clerk" as const,
        canUpload: true,
        authorizedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ] as AllottedMember[],

    // Available Judges for Transfer
    availableJudges: [
      { id: "judge-001", full_name: "Hon. Justice Patricia Anderson", role_category: "judiciary" },
      { id: "judge-002", full_name: "Hon. Justice Mark Thompson", role_category: "judiciary" },
      { id: "judge-003", full_name: "Hon. Justice Lisa Rodriguez", role_category: "judiciary" },
      { id: "judge-004", full_name: "Hon. Justice James Mitchell", role_category: "judiciary" },
    ] as JudgeProfile[],
  };
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function JudgeSessionCaseManager({
  caseId,
  caseName,
  caseNumber,
  currentJudgeId,
  onCaseTransferred,
}: JudgeSessionCaseManagerProps) {
  const { roleTheme } = useRole();
  useAuth(); // Hook needed for auth context
  const [state, setState] = useState(() =>
    generateMockData(caseId, caseName, currentJudgeId)
  );

  // Modal States
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [postponeModalOpen, setPostponeModalOpen] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [canUploadToggle, setCanUploadToggle] = useState(true);
  const [selectedTransferJudge, setSelectedTransferJudge] = useState<string>("");

  // Form States
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [postponeReason, setPostponeReason] = useState<string>("");
  const [postponeDate, setPostponeDate] = useState<Date | undefined>(undefined);
  const [postponeTime, setPostponeTime] = useState<string>("");

  // Fetch available judges on mount
  useEffect(() => {
    const fetchJudges = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, role_category")
          .eq("role_category", "judiciary")
          .neq("id", currentJudgeId)
          .order("full_name");

        if (error) {
          console.error("Error fetching judges:", error);
          return;
        }

        if (data && data.length > 0) {
          setState((prev) => ({
            ...prev,
            availableJudges: data.map((j) => ({
              id: j.id,
              full_name: j.full_name,
              role_category: j.role_category,
            })),
          }));
        }
      } catch (error) {
        console.error("Error fetching judges:", error);
      }
    };

    fetchJudges();
  }, [currentJudgeId]);

  // Initialize dates when modals open
  useEffect(() => {
    if (scheduleModalOpen) {
      setSelectedDate(undefined);
      setSelectedTime("");
    }
  }, [scheduleModalOpen]);

  useEffect(() => {
    if (postponeModalOpen) {
      if (state.currentHearingDate) {
        const currentDate = new Date(state.currentHearingDate);
        setPostponeDate(currentDate);
        setPostponeTime(state.currentHearingTime || "");
      } else {
        setPostponeDate(undefined);
        setPostponeTime("");
      }
      setPostponeReason("");
    }
  }, [postponeModalOpen, state.currentHearingDate, state.currentHearingTime]);

  // Generate time slots
  const generateTimeSlots = () => {
    const slots: string[] = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const TIME_SLOTS = generateTimeSlots();

  // ============================================================================
  // WORKFLOW 1: SCHEDULING & POSTPONEMENT HANDLERS
  // ============================================================================

  const handleScheduleHearing = () => {
    setScheduleModalOpen(true);
  };

  const handleScheduleSubmit = () => {
    if (!selectedDate || !selectedTime) {
      toast.error("Please select both date and time");
      return;
    }

    const [hours, minutes] = selectedTime.split(":").map(Number);
    const scheduledDateTime = new Date(selectedDate);
    scheduledDateTime.setHours(hours, minutes, 0, 0);

    if (scheduledDateTime < new Date()) {
      toast.error("Please select a future date and time");
      return;
    }

    setState((prev) => ({
      ...prev,
      hearingStatus: "scheduled",
      currentHearingDate: scheduledDateTime.toISOString(),
      currentHearingTime: selectedTime,
      hearingHistory: [
        {
          id: `hist-${Date.now()}`,
          date: scheduledDateTime.toISOString(),
          time: selectedTime,
          reason: null,
          status: "scheduled",
          createdAt: new Date().toISOString(),
        },
        ...prev.hearingHistory,
      ],
    }));

    toast.success("Hearing scheduled successfully");
    setScheduleModalOpen(false);
    setSelectedDate(undefined);
    setSelectedTime("");
  };

  const handlePostponeHearing = () => {
    setPostponeModalOpen(true);
  };

  const handlePostponeSubmit = () => {
    if (!postponeReason.trim()) {
      toast.error("Please provide a reason for postponement");
      return;
    }

    if (!postponeDate || !postponeTime) {
      toast.error("Please select both new date and time");
      return;
    }

    const [hours, minutes] = postponeTime.split(":").map(Number);
    const newScheduledDateTime = new Date(postponeDate);
    newScheduledDateTime.setHours(hours, minutes, 0, 0);

    if (newScheduledDateTime < new Date()) {
      toast.error("Please select a future date and time");
      return;
    }

    // Move current schedule to history with reason
    const oldDate = state.currentHearingDate
      ? new Date(state.currentHearingDate)
      : new Date();
    const oldTime = state.currentHearingTime || "00:00";

    setState((prev) => ({
      ...prev,
      hearingStatus: "scheduled",
      currentHearingDate: newScheduledDateTime.toISOString(),
      currentHearingTime: postponeTime,
      hearingHistory: [
        {
          id: `hist-${Date.now()}`,
          date: oldDate.toISOString(),
          time: oldTime,
          reason: postponeReason.trim(),
          status: "postponed",
          createdAt: new Date().toISOString(),
        },
        ...prev.hearingHistory,
      ],
    }));

    toast.success("Hearing postponed successfully");
    setPostponeModalOpen(false);
    setPostponeReason("");
    setPostponeDate(undefined);
    setPostponeTime("");
  };

  // ============================================================================
  // WORKFLOW 2: PARTICIPANT ACCESS REQUESTS HANDLERS
  // ============================================================================

  const handleApproveRequest = (request: AccessRequest) => {
    setSelectedRequest(request);
    setCanUploadToggle(true); // Default to allowing upload
    setApprovalModalOpen(true);
  };

  const handleRejectRequest = (requestId: string) => {
    setState((prev) => ({
      ...prev,
      pendingAccessRequests: prev.pendingAccessRequests.filter(
        (req) => req.requestId !== requestId
      ),
    }));
    toast.success("Access request rejected");
  };

  const handleConfirmApproval = () => {
    if (!selectedRequest) return;

    // Add to allotted members
    const newMember: AllottedMember = {
      id: `auth-${Date.now()}`,
      requesterId: selectedRequest.requesterId,
      requesterName: selectedRequest.requesterName,
      role: selectedRequest.role,
      canUpload: canUploadToggle,
      authorizedAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      allottedMembers: [...prev.allottedMembers, newMember],
      pendingAccessRequests: prev.pendingAccessRequests.filter(
        (req) => req.requestId !== selectedRequest.requestId
      ),
    }));

    toast.success(
      `${selectedRequest.requesterName} has been added to the case team${canUploadToggle ? " with upload permissions" : ""}`
    );
    setApprovalModalOpen(false);
    setSelectedRequest(null);
    setCanUploadToggle(true);
  };

  // ============================================================================
  // WORKFLOW 4: CASE TRANSFER HANDLERS
  // ============================================================================

  const handleTransferCase = async () => {
    if (!selectedTransferJudge) {
      toast.error("Please select a judge to transfer the case to");
      return;
    }

    try {
      // Update case in database
      const { error } = await supabase
        .from("cases")
        .update({
          judge_id: selectedTransferJudge,
          updated_at: new Date().toISOString(),
        })
        .eq("id", caseId);

      if (error) {
        throw error;
      }

      toast.success("Case transferred successfully");
      setTransferModalOpen(false);
      setSelectedTransferJudge("");

      // Callback to notify parent component
      if (onCaseTransferred) {
        onCaseTransferred();
      }
    } catch (error) {
      console.error("Error transferring case:", error);
      toast.error("Failed to transfer case. Please try again.");
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const currentHearingDate = state.currentHearingDate
    ? new Date(state.currentHearingDate)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Gavel className={cn("w-6 h-6", `text-${roleTheme.primary}`)} />
            Session & Case Manager
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {caseName} • {caseNumber}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setTransferModalOpen(true)}
          className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
        >
          <LogOut className="w-4 h-4 mr-2" />
          End Session / Transfer Case
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ========================================================================
            WORKFLOW 1: SCHEDULING & POSTPONEMENT
        ======================================================================== */}
        <div className="space-y-4">
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CalendarIcon className={cn("w-5 h-5", `text-${roleTheme.primary}`)} />
              Hearing Status
            </h3>

            <div className="space-y-4">
              {/* Current Status */}
              <div className="rounded-lg border p-4 bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Status</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      state.hearingStatus === "scheduled"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    )}
                  >
                    {state.hearingStatus === "scheduled" ? "Scheduled" : "Pending"}
                  </Badge>
                </div>

                {state.hearingStatus === "scheduled" && currentHearingDate && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {format(currentHearingDate, "EEEE, MMMM d, yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {format(
                          new Date(`2000-01-01T${state.currentHearingTime}`),
                          "h:mm a"
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {state.hearingStatus === "pending" ? (
                  <Button
                    onClick={handleScheduleHearing}
                    className={cn("flex-1", `bg-${roleTheme.primary} hover:opacity-90`)}
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Schedule Hearing
                  </Button>
                ) : (
                  <Button
                    onClick={handlePostponeHearing}
                    variant="outline"
                    className="flex-1 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Postpone
                  </Button>
                )}
              </div>
            </div>
          </GlassCard>

          {/* Session History */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <History className={cn("w-5 h-5", `text-${roleTheme.primary}`)} />
              Session History
            </h3>

            {state.hearingHistory.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No session history available
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                <AnimatePresence>
                  {state.hearingHistory.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="rounded-lg border p-4 bg-secondary/30"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CalendarIcon className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {format(new Date(entry.date), "MMM d, yyyy")}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              at {format(new Date(`2000-01-01T${entry.time}`), "h:mm a")}
                            </span>
                          </div>
                          {entry.reason && (
                            <div className="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                              <p className="text-xs font-medium text-amber-400 mb-1">
                                Postponement Reason:
                              </p>
                              <p className="text-xs text-muted-foreground">{entry.reason}</p>
                            </div>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            entry.status === "completed"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : entry.status === "postponed"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          )}
                        >
                          {entry.status}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </GlassCard>
        </div>

        {/* ========================================================================
            WORKFLOW 2: PARTICIPANT ACCESS REQUESTS & WORKFLOW 3: ALLOTTED MEMBERS
        ======================================================================== */}
        <div className="space-y-4">
          {/* Pending Access Requests */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UserPlus className={cn("w-5 h-5", `text-${roleTheme.primary}`)} />
              Pending Access Requests
              {state.pendingAccessRequests.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {state.pendingAccessRequests.length}
                </Badge>
              )}
            </h3>

            {state.pendingAccessRequests.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                No pending requests
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                <AnimatePresence>
                  {state.pendingAccessRequests.map((request) => (
                    <motion.div
                      key={request.requestId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="rounded-lg border p-4 bg-amber-500/5 border-amber-500/20"
                    >
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-sm">{request.requesterName}</p>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                request.role === "Lawyer"
                                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                  : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                              )}
                            >
                              {request.role}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">
                            ID: {request.requesterId}
                          </p>
                        </div>

                        <div className="p-2 rounded bg-muted/50 border border-white/5">
                          <p className="text-xs text-muted-foreground mb-1">Message:</p>
                          <p className="text-xs">{request.message}</p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectRequest(request.requestId)}
                            className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApproveRequest(request)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </GlassCard>

          {/* Allotted Members (Case Team) */}
          <GlassCard className="p-6">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="allotted-members" className="border-none">
                <AccordionTrigger className="hover:no-underline">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Users className={cn("w-5 h-5", `text-${roleTheme.primary}`)} />
                    Case Team / Allotted Members
                    <Badge variant="outline" className="ml-2">
                      {state.allottedMembers.length}
                    </Badge>
                  </h3>
                </AccordionTrigger>
                <AccordionContent>
                  {state.allottedMembers.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No members allotted yet
                    </div>
                  ) : (
                    <div className="mt-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Permissions</TableHead>
                            <TableHead>Authorized</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {state.allottedMembers.map((member) => (
                            <TableRow key={member.id}>
                              <TableCell className="font-medium">
                                {member.requesterName}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-xs",
                                    member.role === "Lawyer"
                                      ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                      : member.role === "Clerk"
                                      ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                  )}
                                >
                                  {member.role}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {member.canUpload ? (
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1 w-fit"
                                  >
                                    <Upload className="w-3 h-3" />
                                    Can Upload
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-gray-500/10 text-gray-400 border-gray-500/20 w-fit"
                                  >
                                    View Only
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {format(new Date(member.authorizedAt), "MMM d, yyyy")}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </GlassCard>
        </div>
      </div>

      {/* ========================================================================
          MODALS
      ======================================================================== */}

      {/* Schedule Hearing Modal */}
      <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule Hearing</DialogTitle>
            <DialogDescription>
              Select a date and time slot for the hearing
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="rounded-lg bg-muted/50 p-4 space-y-1">
              <p className="text-sm font-medium">{caseName}</p>
              <p className="text-xs text-muted-foreground font-mono">{caseNumber}</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Select Date
              </Label>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="rounded-md border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Select Time
              </Label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a time slot" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {format(new Date(`2000-01-01T${time}`), "h:mm a")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedDate && selectedTime && (
              <div className="rounded-lg bg-primary/10 p-4 border border-primary/20">
                <p className="text-sm font-medium mb-1">Scheduled For:</p>
                <p className="text-lg font-semibold">
                  {format(selectedDate, "EEEE, MMMM d, yyyy")} at{" "}
                  {format(new Date(`2000-01-01T${selectedTime}`), "h:mm a")}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleScheduleSubmit}
              disabled={!selectedDate || !selectedTime}
            >
              Schedule Hearing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Postpone Hearing Modal */}
      <Dialog open={postponeModalOpen} onOpenChange={setPostponeModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Postpone Hearing</DialogTitle>
            <DialogDescription>
              Provide a reason and select a new date and time
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="rounded-lg bg-muted/50 p-4 space-y-1">
              <p className="text-sm font-medium">{caseName}</p>
              <p className="text-xs text-muted-foreground font-mono">{caseNumber}</p>
              {currentHearingDate && (
                <p className="text-xs text-muted-foreground mt-2">
                  Current: {format(currentHearingDate, "PPP 'at' h:mm a")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Postponement *</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Witness unavailable, Additional evidence needed..."
                value={postponeReason}
                onChange={(e) => setPostponeReason(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                New Date
              </Label>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={postponeDate}
                  onSelect={setPostponeDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="rounded-md border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                New Time
              </Label>
              <Select value={postponeTime} onValueChange={setPostponeTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a time slot" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {format(new Date(`2000-01-01T${time}`), "h:mm a")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPostponeModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePostponeSubmit}
              disabled={!postponeReason.trim() || !postponeDate || !postponeTime}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Postpone Hearing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Confirmation Modal */}
      <Dialog open={approvalModalOpen} onOpenChange={setApprovalModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Grant Upload Permissions?</DialogTitle>
            <DialogDescription>
              Configure access permissions for this participant
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <div>
                  <p className="text-sm font-medium">{selectedRequest.requesterName}</p>
                  <p className="text-xs text-muted-foreground">{selectedRequest.role}</p>
                </div>
                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs text-muted-foreground mb-2">Request Message:</p>
                  <p className="text-xs">{selectedRequest.message}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border bg-background">
                <div className="space-y-0.5">
                  <Label htmlFor="upload-toggle" className="text-sm font-medium">
                    Can Upload Files
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Allow this participant to upload evidence and documents
                  </p>
                </div>
                <Switch
                  id="upload-toggle"
                  checked={canUploadToggle}
                  onCheckedChange={setCanUploadToggle}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setApprovalModalOpen(false);
                setSelectedRequest(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmApproval} className="bg-emerald-600 hover:bg-emerald-700">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Confirm Authorization
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Case Transfer Modal */}
      <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>End Session / Transfer Case</DialogTitle>
            <DialogDescription>
              Transfer this case to another judge. You will no longer have access to manage this case.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-400 mb-1">
                    Important Notice
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Transferring this case will assign it to the selected judge. This action cannot be undone.
                    Make sure all pending tasks are completed before transferring.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-4 space-y-1">
              <p className="text-sm font-medium">{caseName}</p>
              <p className="text-xs text-muted-foreground font-mono">{caseNumber}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="judge-select">Select Next Judge *</Label>
              <Select value={selectedTransferJudge} onValueChange={setSelectedTransferJudge}>
                <SelectTrigger id="judge-select">
                  <SelectValue placeholder="Choose a judge to transfer the case to" />
                </SelectTrigger>
                <SelectContent>
                  {state.availableJudges.map((judge) => (
                    <SelectItem key={judge.id} value={judge.id}>
                      {judge.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.availableJudges.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No other judges available. Please add judges to the system first.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleTransferCase}
              disabled={!selectedTransferJudge}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Transfer Case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

