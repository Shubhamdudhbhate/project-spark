import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Video,
  Image,
  Music,
  File,
  Shield,
  Lock,
  Play,
  History,
  Presentation,
  PenTool,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChainOfCustodyModal } from "./ChainOfCustodyModal";

interface EvidenceItem {
  id: string;
  title: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  file_url: string | null;
  status: string | null;
  uploaded_by: string;
  uploader_name?: string;
  created_at: string | null;
  signed_at: string | null;
  signer_name?: string;
  signature_hash: string | null;
  evidence_type: string | null;
}

interface EvidenceVaultProps {
  evidence: EvidenceItem[];
  onPreview: (evidence: EvidenceItem) => void;
  onPresent: (evidence: EvidenceItem, index: number) => void;
  onSign?: (evidence: EvidenceItem) => void;
  isJudge?: boolean;
}

const getFileIcon = (fileType: string | null) => {
  if (!fileType) return File;
  if (fileType.includes("pdf") || fileType.includes("document")) return FileText;
  if (fileType.includes("video")) return Video;
  if (fileType.includes("image")) return Image;
  if (fileType.includes("audio")) return Music;
  return File;
};

const getStatusConfig = (status: string | null) => {
  switch (status) {
    case "approved":
      return {
        label: "Sealed",
        icon: Lock,
        className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      };
    case "pending_review":
      return {
        label: "Pending Review",
        icon: Clock,
        className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      };
    case "rejected":
      return {
        label: "Rejected",
        icon: File,
        className: "bg-destructive/10 text-destructive border-destructive/20",
      };
    default:
      return {
        label: "Draft",
        icon: FileText,
        className: "bg-muted/50 text-muted-foreground border-muted",
      };
  }
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return "N/A";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const EvidenceVault = ({
  evidence,
  onPreview,
  onPresent,
  onSign,
  isJudge = false,
}: EvidenceVaultProps) => {
  const [historyModal, setHistoryModal] = useState<{ isOpen: boolean; evidenceId: string; title: string }>({
    isOpen: false,
    evidenceId: "",
    title: "",
  });

  const approvedEvidence = evidence.filter((e) => e.status === "approved");
  const pendingEvidence = evidence.filter((e) => e.status === "pending_review");

  const openHistory = (ev: EvidenceItem) => {
    setHistoryModal({ isOpen: true, evidenceId: ev.id, title: ev.title });
  };

  const renderEvidenceCard = (ev: EvidenceItem, index: number) => {
    const FileIcon = getFileIcon(ev.file_type);
    const status = getStatusConfig(ev.status);
    const StatusIcon = status.icon;
    const isSealed = ev.status === "approved";
    const isPending = ev.status === "pending_review";
    const isVideo = ev.file_type?.includes("video");
    const isImage = ev.file_type?.includes("image");
    const isAudio = ev.file_type?.includes("audio");

    return (
      <motion.div
        key={ev.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className={cn(
          "glass-card overflow-hidden border-2 transition-all",
          isSealed
            ? "border-emerald-500/30 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]"
            : isPending
            ? "border-amber-500/30 border-dashed"
            : "border-white/5"
        )}
      >
        {/* Preview Area */}
        <div
          onClick={() => onPreview(ev)}
          className="relative aspect-video bg-secondary/30 cursor-pointer group"
        >
          {/* Media preview */}
          {(isImage || (isVideo && ev.file_url)) && ev.file_url ? (
            <img
              src={ev.file_url}
              alt={ev.file_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="p-4 rounded-full bg-background/50">
                <FileIcon className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>
          )}

          {/* Video play overlay */}
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="p-3 rounded-full bg-primary/90 shadow-lg">
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

          {/* Status badge */}
          <div className="absolute top-2 right-2">
            <Badge variant="outline" className={cn("text-xs", status.className)}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {status.label}
            </Badge>
          </div>

          {/* Seal indicator */}
          {isSealed && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              className="absolute bottom-2 left-2"
            >
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400">Sealed</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <h4 className="font-medium text-sm truncate" title={ev.title}>
            {ev.title}
          </h4>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatFileSize(ev.file_size)}</span>
            <span>
              {ev.created_at && new Date(ev.created_at).toLocaleDateString("en-IN")}
            </span>
          </div>

          {/* Uploader info */}
          <div className="pt-2 border-t border-white/5 space-y-1.5 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="w-3 h-3" />
              <span>Uploaded by {ev.uploader_name || "Unknown"}</span>
            </div>
            {ev.signer_name && (
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>Sealed by {ev.signer_name}</span>
              </div>
            )}
          </div>

          {/* Hash */}
          {ev.signature_hash && (
            <div className="flex items-center gap-2 text-xs">
              <Lock className="w-3 h-3 text-primary/70" />
              <span className="font-mono text-primary/70 bg-primary/5 px-2 py-1 rounded truncate flex-1">
                {ev.signature_hash.slice(0, 12)}...{ev.signature_hash.slice(-6)}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openHistory(ev)}
              className="flex-1 text-xs"
            >
              <History className="w-3.5 h-3.5 mr-1" />
              History
            </Button>
            {isSealed && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPresent(ev, index)}
                className="flex-1 text-xs border-primary/20 text-primary hover:bg-primary/10"
              >
                <Presentation className="w-3.5 h-3.5 mr-1" />
                Present
              </Button>
            )}
            {isJudge && isPending && onSign && (
              <Button
                size="sm"
                onClick={() => onSign(ev)}
                className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700"
              >
                <PenTool className="w-3.5 h-3.5 mr-1" />
                Seal
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Sealed Evidence Section */}
      {approvedEvidence.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold">Sealed Evidence</h3>
              <p className="text-xs text-muted-foreground">
                {approvedEvidence.length} item(s) with judicial finality
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {approvedEvidence.map((ev, index) => renderEvidenceCard(ev, index))}
          </div>
        </div>
      )}

      {/* Pending Evidence Section (visible to all authorized users) */}
      {pendingEvidence.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold">Pending Review</h3>
              <p className="text-xs text-muted-foreground">
                {pendingEvidence.length} item(s) awaiting judicial seal
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingEvidence.map((ev, index) => renderEvidenceCard(ev, index))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {evidence.length === 0 && (
        <div className="text-center py-12">
          <Shield className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No evidence in the vault yet</p>
        </div>
      )}

      {/* Chain of Custody Modal */}
      <ChainOfCustodyModal
        isOpen={historyModal.isOpen}
        onClose={() => setHistoryModal({ isOpen: false, evidenceId: "", title: "" })}
        evidenceId={historyModal.evidenceId}
        evidenceTitle={historyModal.title}
      />
    </div>
  );
};
