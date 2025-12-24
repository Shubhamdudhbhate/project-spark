import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileText, Save, Clock, CheckCircle2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CourtSession } from '@/hooks/useCourtSession';

interface JudicialNotepadProps {
  session: CourtSession;
  onSaveNotes: (notes: string) => Promise<boolean>;
}

export const JudicialNotepad = ({
  session,
  onSaveNotes,
}: JudicialNotepadProps) => {
  const [notes, setNotes] = useState(session.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Auto-save debounce
  useEffect(() => {
    if (!hasChanges) return;

    const timer = setTimeout(async () => {
      setIsSaving(true);
      const success = await onSaveNotes(notes);
      if (success) {
        setLastSaved(new Date());
        setHasChanges(false);
      }
      setIsSaving(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [notes, hasChanges, onSaveNotes]);

  const handleChange = useCallback((value: string) => {
    setNotes(value);
    setHasChanges(true);
  }, []);

  const handleManualSave = async () => {
    setIsSaving(true);
    const success = await onSaveNotes(notes);
    if (success) {
      setLastSaved(new Date());
      setHasChanges(false);
    }
    setIsSaving(false);
  };

  const sessionDuration = Math.round(
    (Date.now() - new Date(session.started_at).getTime()) / 60000
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Session Notes</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Session active for {sessionDuration} min
            </p>
          </div>
        </div>

        {/* Save Status */}
        <div className="flex items-center gap-2">
          {isSaving ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              Saving...
            </div>
          ) : hasChanges ? (
            <div className="flex items-center gap-2 text-xs text-amber-400">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              Unsaved changes
            </div>
          ) : lastSaved ? (
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              Saved
            </div>
          ) : null}
        </div>
      </div>

      {/* Editor */}
      <div className="space-y-3">
        <Textarea
          value={notes}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Write your session observations, notes, and minutes here...

• Key points discussed
• Witness statements
• Rulings and decisions
• Action items"
          className={cn(
            "min-h-[200px] bg-secondary/30 border-white/10 resize-none",
            "focus:ring-2 focus:ring-primary/20 transition-all"
          )}
        />

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Auto-saves every 2 seconds • {notes.length} characters
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualSave}
            disabled={isSaving || !hasChanges}
            className="border-primary/20 text-primary hover:bg-primary/10"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Now
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
        <p className="text-xs text-primary/80">
          <strong>Private Notes:</strong> These notes are only visible to you and will be 
          saved with this session's record for future reference.
        </p>
      </div>
    </motion.div>
  );
};
