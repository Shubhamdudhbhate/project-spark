import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Square,
  Shield,
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { CourtSession, PermissionRequest } from '@/hooks/useCourtSession';

interface JudgeControlPanelProps {
  isSessionActive: boolean;
  session: CourtSession | null;
  permissionRequests: PermissionRequest[];
  onStartSession: () => Promise<CourtSession | null>;
  onEndSession: (notes?: string) => Promise<boolean>;
  onRespondPermission: (requestId: string, grant: boolean) => Promise<boolean>;
}

export const JudgeControlPanel = ({
  isSessionActive,
  session,
  permissionRequests,
  onStartSession,
  onEndSession,
  onRespondPermission,
}: JudgeControlPanelProps) => {
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [endConfirmOpen, setEndConfirmOpen] = useState(false);

  const pendingRequests = permissionRequests.filter(r => r.status === 'pending');
  const grantedCount = permissionRequests.filter(r => r.status === 'granted').length;

  const handleStartSession = async () => {
    setIsStarting(true);
    await onStartSession();
    setIsStarting(false);
  };

  const handleEndSession = async () => {
    setIsEnding(true);
    await onEndSession();
    setIsEnding(false);
    setEndConfirmOpen(false);
  };

  const sessionDuration = session
    ? Math.round((Date.now() - new Date(session.started_at).getTime()) / 60000)
    : 0;

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Shield className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h3 className="font-semibold">Judge's Control Panel</h3>
          <p className="text-xs text-muted-foreground">
            Manage court session & permissions
          </p>
        </div>
      </div>

      {/* Session Status */}
      <div className={cn(
        "p-4 rounded-lg border-2 transition-all",
        isSessionActive 
          ? "bg-emerald-500/5 border-emerald-500/30" 
          : "bg-muted/30 border-dashed border-white/10"
      )}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isSessionActive ? (
              <>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-medium text-emerald-400">Session Active</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">No Active Session</span>
              </>
            )}
          </div>
          {isSessionActive && (
            <Badge variant="outline" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              {sessionDuration} min
            </Badge>
          )}
        </div>

        {!isSessionActive ? (
          <Button
            onClick={handleStartSession}
            disabled={isStarting}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {isStarting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Start Court Session
          </Button>
        ) : (
          <Button
            variant="destructive"
            onClick={() => setEndConfirmOpen(true)}
            className="w-full"
          >
            <Square className="w-4 h-4 mr-2" />
            End Session
          </Button>
        )}
      </div>

      {/* Permission Requests */}
      <AnimatePresence>
        {isSessionActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                Permission Requests
              </h4>
              {grantedCount > 0 && (
                <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  <Users className="w-3 h-3 mr-1" />
                  {grantedCount} granted
                </Badge>
              )}
            </div>

            {pendingRequests.length > 0 ? (
              <div className="space-y-2">
                {pendingRequests.map((request) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {request.requester_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Requesting upload permission
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onRespondPermission(request.id, false)}
                          className="h-8 w-8 p-0 border-destructive/30 text-destructive hover:bg-destructive/10"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onRespondPermission(request.id, true)}
                          className="h-8 w-8 p-0 bg-emerald-600 hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-sm text-muted-foreground">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No pending requests
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* End Session Confirmation */}
      <Dialog open={endConfirmOpen} onOpenChange={setEndConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Court Session?</DialogTitle>
            <DialogDescription>
              This will close the current session and notify all participants.
              All pending permission requests will expire.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-400">
                <strong>Session Duration:</strong> {sessionDuration} minutes
              </p>
              {pendingRequests.length > 0 && (
                <p className="text-sm text-amber-400 mt-1">
                  <strong>{pendingRequests.length}</strong> pending request(s) will expire
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEndConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleEndSession}
              disabled={isEnding}
            >
              {isEnding ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              ) : (
                <Square className="w-4 h-4 mr-2" />
              )}
              End Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
