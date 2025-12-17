import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Video,
  Image,
  Music,
  File,
  Shield,
  Clock,
  User,
  Hash,
  Calendar,
} from "lucide-react";
import { Evidence } from "@/types/case";
import { cn } from "@/lib/utils";

interface EvidencePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evidence: Evidence | null;
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
    className: "bg-muted/50 text-muted-foreground border-muted",
  },
  pending: {
    label: "Pending Verification",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  signed: {
    label: "Digitally Signed",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  immutable: {
    label: "On-Chain / Immutable",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const EvidencePreviewModal = ({
  open,
  onOpenChange,
  evidence,
}: EvidencePreviewModalProps) => {
  if (!evidence) return null;

  const FileIcon = getFileIcon(evidence.fileType);
  const status = statusConfig[evidence.status];
  const isVideo = evidence.fileType.includes("video");
  const isAudio = evidence.fileType.includes("audio");
  const isImage = evidence.fileType.includes("image");
  const isPdf = evidence.fileType.includes("pdf");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-white/10 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileIcon className="w-5 h-5 text-primary" />
            Evidence Preview
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview Area */}
          <div className="relative aspect-video rounded-lg bg-secondary/30 border border-white/5 overflow-hidden flex items-center justify-center">
            {isVideo && evidence.fileUrl && (
              <video
                controls
                className="w-full h-full object-contain"
                poster={evidence.thumbnailUrl || undefined}
              >
                <source src={evidence.fileUrl} type={evidence.fileType} />
                Your browser does not support video playback.
              </video>
            )}
            {isAudio && evidence.fileUrl && (
              <div className="p-8 w-full">
                <div className="p-6 rounded-lg bg-background/50 flex flex-col items-center gap-4">
                  <Music className="w-16 h-16 text-primary" />
                  <audio controls className="w-full">
                    <source src={evidence.fileUrl} type={evidence.fileType} />
                    Your browser does not support audio playback.
                  </audio>
                </div>
              </div>
            )}
            {isImage && (
              <img
                src={evidence.fileUrl || "/placeholder.svg"}
                alt={evidence.fileName}
                className="w-full h-full object-contain"
              />
            )}
            {isPdf && evidence.fileUrl && (
              <iframe
                src={evidence.fileUrl}
                className="w-full h-full"
                title={evidence.fileName}
              />
            )}
            {!isVideo && !isAudio && !isImage && !isPdf && (
              <div className="flex flex-col items-center gap-4 p-8">
                <div className="p-6 rounded-full bg-background/50">
                  <FileIcon className="w-16 h-16 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  Preview not available for this file type
                </p>
              </div>
            )}

            {/* Status overlay */}
            <div className="absolute top-4 right-4">
              <Badge variant="outline" className={cn("text-sm", status.className)}>
                {status.label}
              </Badge>
            </div>

            {/* Digital seal */}
            {(evidence.status === "signed" || evidence.status === "immutable") && (
              <div className="absolute bottom-4 left-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">
                    Digitally Sealed
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* File Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-secondary/30 border border-white/5">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <FileText className="w-4 h-4" />
                <span className="text-xs">File Name</span>
              </div>
              <p className="font-medium truncate" title={evidence.fileName}>
                {evidence.fileName}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-secondary/30 border border-white/5">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs">File Size</span>
              </div>
              <p className="font-medium">{formatFileSize(evidence.fileSize)}</p>
            </div>

            <div className="p-4 rounded-lg bg-secondary/30 border border-white/5">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <User className="w-4 h-4" />
                <span className="text-xs">Uploaded By</span>
              </div>
              <p className="font-medium">{evidence.uploadedBy}</p>
            </div>

            <div className="p-4 rounded-lg bg-secondary/30 border border-white/5">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs">Upload Date</span>
              </div>
              <p className="font-medium">
                {new Date(evidence.uploadedAt).toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {/* Hash */}
          {evidence.hash && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Hash className="w-4 h-4" />
                <span className="text-xs font-medium">Blockchain Hash</span>
              </div>
              <p className="font-mono text-sm text-primary/80 break-all">
                {evidence.hash}
              </p>
            </div>
          )}

          {/* Signature Info */}
          {evidence.signedBy && (
            <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-center gap-2 text-emerald-400 mb-2">
                <Shield className="w-4 h-4" />
                <span className="text-xs font-medium">Digital Signature</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm">Signed by {evidence.signedBy}</p>
                {evidence.signedAt && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(evidence.signedAt).toLocaleString("en-IN")}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
