import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarIcon,
  Clock,
  FileText,
  UserPlus,
  CheckCircle2,
  XCircle,
  History,
  Upload,
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRole } from "@/contexts/RoleContext";

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
  caseId: string;
  caseName: string;
  requesterId: string;
  requesterName: string;
  role: "Clerk" | "Lawyer";
  message: string;
  requestedAt: string;
};

type AuthorizedParticipant = {
  id: string;
  requesterId: string;
  requesterName: string;
  role: "Clerk" | "Lawyer";
  canUpload: boolean;
  authorizedAt: string;
};

interface JudgeCaseSessionManagerProps {
  caseId: string;
  caseName: string;
  caseNumber: string;
}

// ============================================================================
// INITIAL STATE WITH MOCK DATA
// ============================================================================

const generateMockData = (caseId: string, caseName: string) => {
  return {
    // Hearing Status
    hearingStatus: "scheduled" as HearingStatus,
    currentHearingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    currentHearingTime: "14:30",

    // Hearing History
    hearingHistory: [
      {
        id: "hist-1",
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        time: "10:00",
        reason: null,
        status: "completed" as const,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "hist-2",
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
        time: "11:00",
        reason: "Witness unavailable due to medical emergency",
        status: "postponed" as const,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "hist-3",
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        time: "14:00",
        reason: null,
        status: "scheduled" as const,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ] as HearingHistoryEntry[],

    // Pending Access Requests
    pendingAccessRequests: [
      {
        requestId: "req-001",
        caseId: caseId,
        caseName: caseName,
        requesterId: "user-clerk-123",
        requesterName: "Sarah Johnson",
        role: "Clerk" as const,
        message: "I am the court clerk assigned to this case and need access to manage case documents.",
        requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      },
      {
        requestId: "req-002",
        caseId: caseId,
        caseName: caseName,
        requesterId: "user-lawyer-456",
        requesterName: "Michael Chen",
        role: "Lawyer" as const,
        message: "I am the defense attorney representing the defendant in this case.",
        requestedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      },
      {
        requestId: "req-003",
        caseId: caseId,
        caseName: caseName,
        requesterId: "user-lawyer-789",
        requesterName: "Emily Rodriguez",
        role: "Lawyer" as const,
        message: "I am the prosecuting attorney and need access to upload evidence files.",
        requestedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      },
    ] as AccessRequest[],

    // Authorized Participants
    authorizedParticipants: [
      {
        id: "auth-001",
        requesterId: "user-lawyer-111",
        requesterName: "David Thompson",
        role: "Lawyer" as const,
        canUpload: true,
        authorizedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ] as AuthorizedParticipant[],
  };
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function JudgeCaseSessionManager({
  caseId,
  caseName,
  caseNumber,
}: JudgeCaseSessionManagerProps) {
  const { roleTheme } = useRole();
  const [state, setState] = useState(() => generateMockData(caseId, caseName));

  // Modal States
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [postponeModalOpen, setPostponeModalOpen] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [canUploadToggle, setCanUploadToggle] = useState(true);

  // Form States
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [postponeReason, setPostponeReason] = useState<string>("");
  const [postponeDate, setPostponeDate] = useState<Date | undefined>(undefined);
  const [postponeTime, setPostponeTime] = useState<string>("");

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
  // SCHEDULING WORKFLOW HANDLERS
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
  // ACCESS CONTROL WORKFLOW HANDLERS
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

    // Add to authorized participants
    const newParticipant: AuthorizedParticipant = {
      id: `auth-${Date.now()}`,
      requesterId: selectedRequest.requesterId,
      requesterName: selectedRequest.requesterName,
      role: selectedRequest.role,
      canUpload: canUploadToggle,
      authorizedAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      authorizedParticipants: [...prev.authorizedParticipants, newParticipant],
      pendingAccessRequests: prev.pendingAccessRequests.filter(
        (req) => req.requestId !== selectedRequest.requestId
      ),
    }));

    toast.success(
      `${selectedRequest.requesterName} has been authorized${canUploadToggle ? " with upload permissions" : ""}`
    );
    setApprovalModalOpen(false);
    setSelectedRequest(null);
    setCanUploadToggle(true);
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
            <FileText className={cn("w-6 h-6", `text-${roleTheme.primary}`)} />
            Case Session Manager
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {caseName} • {caseNumber}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ========================================================================
            SCHEDULING & POSTPONEMENT WORKFLOW
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

          {/* Hearing History */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <History className={cn("w-5 h-5", `text-${roleTheme.primary}`)} />
              Hearing History
            </h3>

            {state.hearingHistory.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No hearing history available
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
            PARTICIPANT ACCESS CONTROL WORKFLOW
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
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
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
                          <p className="text-xs text-muted-foreground mt-1">
                            Case: {request.caseName}
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

          {/* Authorized Participants */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className={cn("w-5 h-5", `text-${roleTheme.primary}`)} />
              Authorized Participants
            </h3>

            {state.authorizedParticipants.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No authorized participants yet
              </div>
            ) : (
              <div className="space-y-2">
                {state.authorizedParticipants.map((participant) => (
                  <div
                    key={participant.id}
                    className="rounded-lg border p-3 bg-secondary/30 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{participant.requesterName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            participant.role === "Lawyer"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          )}
                        >
                          {participant.role}
                        </Badge>
                        {participant.canUpload && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1"
                          >
                            <Upload className="w-3 h-3" />
                            Can Upload
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
    </div>
  );
}

