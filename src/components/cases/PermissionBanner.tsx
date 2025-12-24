import { motion } from 'framer-motion';
import { Lock, Hand, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PermissionRequest } from '@/hooks/useCourtSession';

interface PermissionBannerProps {
  isSessionActive: boolean;
  myPermission: PermissionRequest | null;
  isJudge: boolean;
  onRequestPermission: () => Promise<PermissionRequest | null>;
  isRequesting?: boolean;
}

export const PermissionBanner = ({
  isSessionActive,
  myPermission,
  isJudge,
  onRequestPermission,
  isRequesting = false,
}: PermissionBannerProps) => {
  // Judges always have permission
  if (isJudge) return null;

  // No active session
  if (!isSessionActive) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-lg bg-muted/50 border-2 border-dashed border-white/10"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <AlertCircle className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-muted-foreground">
              Waiting for Court Session
            </p>
            <p className="text-sm text-muted-foreground/70">
              Evidence uploads are disabled until the Judge starts a session
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Permission granted
  if (myPermission?.status === 'granted') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/20">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="font-medium text-emerald-400">
              Permission Granted
            </p>
            <p className="text-sm text-emerald-400/70">
              You can now upload evidence for this session
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Permission pending
  if (myPermission?.status === 'pending') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20">
            <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
          <div>
            <p className="font-medium text-amber-400">
              Request Pending
            </p>
            <p className="text-sm text-amber-400/70">
              Waiting for the Judge to approve your upload permission
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Permission denied (show request again)
  if (myPermission?.status === 'denied') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-lg bg-destructive/10 border border-destructive/30"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/20">
              <XCircle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="font-medium text-destructive">
                Permission Denied
              </p>
              <p className="text-sm text-destructive/70">
                Your request was not approved
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRequestPermission}
            disabled={isRequesting}
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            <Hand className="w-4 h-4 mr-2" />
            Request Again
          </Button>
        </div>
      </motion.div>
    );
  }

  // No permission - show request button
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-lg border-2 border-dashed transition-all",
        "bg-primary/5 border-primary/30"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">
              Upload Permission Required
            </p>
            <p className="text-sm text-muted-foreground">
              Request permission from the Judge to submit evidence
            </p>
          </div>
        </div>
        <Button
          onClick={onRequestPermission}
          disabled={isRequesting}
          className="bg-primary hover:bg-primary/90"
        >
          {isRequesting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
          ) : (
            <Hand className="w-4 h-4 mr-2" />
          )}
          Request Permission
        </Button>
      </div>
    </motion.div>
  );
};
