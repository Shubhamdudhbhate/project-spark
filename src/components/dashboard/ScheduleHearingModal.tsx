import { useState, useEffect } from "react";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface ScheduleHearingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  caseNumber: string;
  caseTitle: string;
  currentScheduledDate?: string | null;
  onSchedule: (caseId: string, date: Date, time: string) => Promise<void>;
}

// Generate time slots (9 AM to 5 PM, 30-minute intervals)
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

export function ScheduleHearingModal({
  open,
  onOpenChange,
  caseId,
  caseNumber,
  caseTitle,
  currentScheduledDate,
  onSchedule,
}: ScheduleHearingModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRescheduling = !!currentScheduledDate;

  // Initialize with current scheduled date if rescheduling
  useEffect(() => {
    if (open) {
      if (currentScheduledDate) {
        const date = new Date(currentScheduledDate);
        setSelectedDate(date);
        // Extract time from the datetime string
        const timeString = format(date, "HH:mm");
        setSelectedTime(timeString);
      } else {
        setSelectedDate(undefined);
        setSelectedTime("");
      }
    }
  }, [open, currentScheduledDate]);

  const handleSubmit = async () => {
    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }

    if (!selectedTime) {
      toast.error("Please select a time");
      return;
    }

    // Combine date and time
    const [hours, minutes] = selectedTime.split(":").map(Number);
    const scheduledDateTime = new Date(selectedDate);
    scheduledDateTime.setHours(hours, minutes, 0, 0);

    // Validate that the scheduled time is in the future
    if (scheduledDateTime < new Date()) {
      toast.error("Please select a future date and time");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSchedule(caseId, scheduledDateTime, selectedTime);
      toast.success(
        isRescheduling
          ? "Hearing rescheduled successfully"
          : "Hearing scheduled successfully"
      );
      onOpenChange(false);
      // Reset form
      setSelectedDate(undefined);
      setSelectedTime("");
    } catch (error) {
      console.error("Error scheduling hearing:", error);
      toast.error("Failed to schedule hearing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isRescheduling ? "Reschedule Hearing" : "Schedule Hearing"}
          </DialogTitle>
          <DialogDescription>
            {isRescheduling
              ? "Update the date and time for this hearing"
              : "Select a date and time slot for the hearing"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Case Information */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-1">
            <p className="text-sm font-medium">{caseTitle}</p>
            <p className="text-xs text-muted-foreground font-mono">
              {caseNumber}
            </p>
            {currentScheduledDate && (
              <p className="text-xs text-muted-foreground mt-2">
                Currently scheduled:{" "}
                <span className="font-medium">
                  {format(new Date(currentScheduledDate), "PPP 'at' h:mm a")}
                </span>
              </p>
            )}
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-2">
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
            {selectedDate && (
              <p className="text-sm text-muted-foreground text-center">
                Selected: {format(selectedDate, "PPP")}
              </p>
            )}
          </div>

          {/* Time Picker */}
          <div className="space-y-2">
            <Label htmlFor="time" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Select Time
            </Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger id="time">
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

          {/* Preview */}
          {selectedDate && selectedTime && (
            <div className="rounded-lg bg-primary/10 p-4 border border-primary/20">
              <p className="text-sm font-medium mb-1">Scheduled For:</p>
              <p className="text-lg font-semibold">
                {format(selectedDate, "EEEE, MMMM d, yyyy")} at{" "}
                {format(
                  new Date(`2000-01-01T${selectedTime}`),
                  "h:mm a"
                )}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedDate || !selectedTime || isSubmitting}
          >
            {isSubmitting
              ? "Saving..."
              : isRescheduling
              ? "Reschedule"
              : "Schedule Hearing"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

