import { useState, useEffect, useCallback, useRef } from "react";
import { StickyNote, Save, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface QuickJudicialNotesProps {
  currentHearingId: string | null;
  currentCaseNumber?: string;
  initialNotes?: string;
  onSaveNotes: (notes: string) => void;
}

export const QuickJudicialNotes = ({
  currentHearingId,
  currentCaseNumber,
  initialNotes = "",
  onSaveNotes,
}: QuickJudicialNotesProps) => {
  const [notes, setNotes] = useState(initialNotes);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced auto-save
  useEffect(() => {
    if (notes !== initialNotes && currentHearingId) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setIsSaving(true);
        onSaveNotes(notes);
        setTimeout(() => {
          setIsSaving(false);
          setLastSaved(new Date());
        }, 500);
      }, 2000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [notes, initialNotes, currentHearingId, onSaveNotes]);

  const handleManualSave = useCallback(() => {
    setIsSaving(true);
    onSaveNotes(notes);
    setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
    }, 500);
  }, [notes, onSaveNotes]);

  const formatLastSaved = (date: Date) => {
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="border-border/50 h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <StickyNote className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Quick Judicial Notes</CardTitle>
              {currentCaseNumber ? (
                <p className="text-sm text-muted-foreground mt-0.5">
                  Notes for {currentCaseNumber}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-0.5">
                  Start a hearing to take notes
                </p>
              )}
            </div>
          </div>
          {currentHearingId && (
            <Badge className="badge-live gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder={
            currentHearingId
              ? "Jot down key points, observations, or preliminary thoughts..."
              : "No active hearing. Select a case from the cause list to begin."
          }
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={!currentHearingId}
          className={cn(
            "min-h-[180px] resize-none",
            !currentHearingId && "opacity-50 cursor-not-allowed"
          )}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isSaving ? (
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Saving...
              </span>
            ) : lastSaved ? (
              <span className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                Last saved at {formatLastSaved(lastSaved)}
              </span>
            ) : null}
          </div>
          <Button
            size="sm"
            onClick={handleManualSave}
            disabled={!currentHearingId || isSaving}
            className="gap-1.5"
          >
            <Save className="h-3.5 w-3.5" />
            Save Notes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
