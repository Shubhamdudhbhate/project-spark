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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Evidence } from "@/types/case";
import { cn } from "@/lib/utils";

interface EvidenceCardProps {
  evidence: Evidence;
  index: number;
  onSign: (evidence: Evidence) => void;
  onPreview: (evidence: Evidence) => void;
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
    label: "Pending",
    icon: Clock,
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  signed: {
    label: "Signed",
    icon: PenTool,
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  immutable: {
    label: "On-Chain",
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
  onSign,
  onPreview,
}: EvidenceCardProps) => {
  const FileIcon = getFileIcon(evidence.fileType);
  const status = statusConfig[evidence.status];
  const StatusIcon = status.icon;
  const isVideo = evidence.fileType.includes("video");
  const canSign = evidence.status === "draft" || evidence.status === "pending";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="glass-card p-4 group"
    >
      {/* Preview Area */}
      <div
        onClick={() => onPreview(evidence)}
        className="relative aspect-video mb-4 rounded-lg bg-secondary/30 border border-white/5 overflow-hidden cursor-pointer group/preview"
      >
        {evidence.fileType.includes("video") && evidence.fileUrl ? (
          <video
            className="absolute inset-0 w-full h-full object-cover"
            src={evidence.fileUrl}
            muted
            preload="metadata"
          />
        ) : evidence.fileType.includes("image") && evidence.fileUrl ? (
          <img
            src={evidence.fileUrl}
            alt={evidence.fileName}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="p-4 rounded-full bg-background/50">
              <FileIcon className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>
        )}

        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity">
            <div className="p-3 rounded-full bg-primary/90 shadow-lg shadow-primary/30">
              <Play className="w-6 h-6 text-primary-foreground fill-current" />
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

        {/* Digital Seal for signed/immutable */}
        {(evidence.status === "signed" || evidence.status === "immutable") && (
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
      </div>

      {/* File Info */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm truncate" title={evidence.fileName}>
          {evidence.fileName}
        </h4>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatFileSize(evidence.fileSize)}</span>
          <span>
            {new Date(evidence.uploadedAt).toLocaleDateString("en-IN")}
          </span>
        </div>

        {/* Signer info */}
        {evidence.signedBy && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2 border-t border-white/5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Signed by {evidence.signedBy}</span>
          </div>
        )}

        {/* Hash preview */}
        {evidence.hash && (
          <div className="pt-2">
            <p className="text-xs font-mono text-primary/70 bg-primary/5 px-2 py-1 rounded truncate">
              {evidence.hash.slice(0, 16)}...{evidence.hash.slice(-8)}
            </p>
          </div>
        )}

        {/* Sign button */}
        {canSign && (
          <Button
            onClick={() => onSign(evidence)}
            size="sm"
            className="w-full mt-3 glow-button bg-primary hover:bg-primary/90"
          >
            <PenTool className="w-4 h-4 mr-2" />
            Authority Sign
          </Button>
        )}
      </div>
    </motion.div>
  );
};
