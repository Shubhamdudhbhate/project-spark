import { motion } from "framer-motion";
import {
  FileText,
  Video,
  Image,
  Music,
  File,
  Play,
  Shield,
  PenTool,
  Clock,
  Lock,
  CheckCircle2,
  User,
  Calendar,
  Hash,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Evidence } from "@/types/case";
import { cn } from "@/lib/utils";
import { useRole } from "@/contexts/RoleContext";
import { JudgeActionPanel } from "./JudgeActionPanel";
import { toast } from "@/hooks/use-toast";

interface EvidenceCardProps {
  evidence: Evidence;
  index: number;
  caseNumber: string;
  onSign: (evidence: Evidence) => void;
  onPreview: (evidence: Evidence) => void;
  onSeal?: (evidence: Evidence, signature: string) => void;
}

const getFileIcon = (fileType: string) => {
  if (fileType.includes("pdf") || fileType.includes("document")) return FileText;
  if (fileType.includes("video")) return Video;
  if (fileType.includes("image")) return Image;
  if (fileType.includes("audio")) return Music;
  return File;
};

const statusConfig = {
  draft: {
    label: "Draft",
    icon: Clock,
    className: "bg-muted/50 text-muted-foreground border-muted",
  },
  pending: {
    label: "Awaiting Judicial Seal",
    icon: Clock,
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  signed: {
    label: "Signed",
    icon: PenTool,
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  immutable: {
    label: "Juridical Finality",
    icon: Lock,
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const EvidenceCard = ({
  evidence,
  index,
  caseNumber,
  onSign,
  onPreview,
  onSeal,
}: EvidenceCardProps) => {
  const { currentUser, hasPermission } = useRole();
  const FileIcon = getFileIcon(evidence.fileType);
  const status = statusConfig[evidence.status];
  const StatusIcon = status.icon;
  const isVideo = evidence.fileType.includes("video");
  const isImage = evidence.fileType.includes("image");
  const isAudio = evidence.fileType.includes("audio");
  
  const isImmutable = evidence.status === "immutable";
  const isPending = evidence.status === "pending" || evidence.status === "draft";
  const canEdit = hasPermission("edit_metadata") && !isImmutable;
  const isJudge = currentUser?.role === "judge";

  const handleClerkSign = () => {
    if (!hasPermission("upload")) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to sign evidence.",
        variant: "destructive",
      });
      return;
    }
    onSign(evidence);
  };

  const handleSeal = (ev: Evidence, signature: string) => {
    if (onSeal) {
      onSeal(ev, signature);
    }
  };

  // Determine border style based on status
  const getBorderStyle = () => {
    if (isImmutable) {
      return "border-emerald-500/50 shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]";
    }
    if (isPending) {
      return "border-dashed border-amber-500/50";
    }
    return "border-white/5";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn(
        "glass-card p-4 group border-2 transition-all duration-300",
        getBorderStyle()
      )}
    >
      {/* Preview Area */}
      <div
        onClick={() => onPreview(evidence)}
        className="relative aspect-video mb-4 rounded-lg bg-secondary/30 border border-white/5 overflow-hidden cursor-pointer group/preview"
      >
        {/* Show thumbnail or placeholder */}
        {evidence.thumbnailUrl || (isImage && evidence.fileUrl) ? (
          <img
            src={evidence.thumbnailUrl || evidence.fileUrl}
            alt={evidence.fileName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="p-4 rounded-full bg-background/50">
              <FileIcon className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>
        )}

        {/* Play overlay for video */}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity">
            <div className="p-3 rounded-full bg-primary/90 shadow-lg shadow-primary/30">
              <Play className="w-6 h-6 text-primary-foreground fill-current" />
            </div>
          </div>
        )}

        {/* Audio indicator */}
        {isAudio && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="p-4 rounded-full bg-primary/20">
              <Music className="w-8 h-8 text-primary" />
            </div>
          </div>
        )}

        {/* Status badge overlay */}
        <div className="absolute top-2 right-2">
          <Badge variant="outline" className={cn("text-xs", status.className)}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {status.label}
          </Badge>
        </div>

        {/* Digital Seal for immutable */}
        {isImmutable && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            className="absolute bottom-2 left-2"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/30 blur-md rounded-full" />
              <div className="relative flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400">
                  Sealed
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Pending indicator for clerk uploads */}
        {isPending && (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-2 left-2"
          >
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/20 border border-amber-500/30">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-medium text-amber-400">
                Provisional
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* File Info */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm truncate" title={evidence.fileName}>
          {evidence.fileName}
        </h4>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatFileSize(evidence.fileSize)}</span>
          <span>
            {new Date(evidence.uploadedAt).toLocaleDateString("en-IN")}
          </span>
        </div>

        {/* Chain of Truth - Audit Log */}
        <div className="pt-3 border-t border-white/5 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Chain of Truth</p>
          
          <div className="space-y-1.5 text-xs">
            {/* Uploaded by */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-3 h-3" />
              <span>Uploaded by {evidence.uploadedBy}</span>
            </div>
            
            {/* Hearing Session */}
            {evidence.hearingSessionId && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>Session #{evidence.hearingSessionId}</span>
              </div>
            )}
            
            {/* Signed by Judge */}
            {evidence.signedBy && (
              <div className="flex items-center gap-2 text-emerald-400 font-medium bg-emerald-500/10 px-2 py-1 rounded">
                <CheckCircle2 className="w-3 h-3" />
                <span>Sealed by {evidence.signedBy}</span>
              </div>
            )}
          </div>
        </div>

        {/* Hash preview */}
        {evidence.hash && (
          <div className="flex items-center gap-2 text-xs">
            <Hash className="w-3 h-3 text-primary/70" />
            <p className="font-mono text-primary/70 bg-primary/5 px-2 py-1 rounded truncate flex-1">
              {evidence.hash.slice(0, 12)}...{evidence.hash.slice(-6)}
            </p>
          </div>
        )}

        {/* Action Buttons based on role */}
        <div className="space-y-2 pt-2">
          {/* Clerk can sign to prepare for judge */}
          {canEdit && currentUser?.role === "clerk" && evidence.status === "draft" && (
            <Button
              onClick={handleClerkSign}
              size="sm"
              variant="outline"
              className="w-full border-primary/20 text-primary hover:bg-primary/10"
            >
              <PenTool className="w-4 h-4 mr-2" />
              Submit for Judicial Review
            </Button>
          )}

          {/* Judge's Seal Button */}
          {isJudge && isPending && onSeal && (
            <JudgeActionPanel
              evidence={evidence}
              caseNumber={caseNumber}
              onSeal={handleSeal}
            />
          )}

          {/* Observer sees read-only badge */}
          {currentUser?.role === "observer" && (
            <Badge variant="outline" className="w-full justify-center py-1.5 bg-slate-500/10 text-slate-400 border-slate-500/20">
              Read-Only Access
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
};
