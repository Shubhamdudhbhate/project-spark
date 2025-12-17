import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, FileText, Video, Image, Music, File, Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Evidence } from "@/types/case";
import { cn } from "@/lib/utils";

interface PresentationModeProps {
  isOpen: boolean;
  onClose: () => void;
  evidence: Evidence[];
  initialIndex?: number;
  caseNumber: string;
}

const getFileIcon = (fileType: string) => {
  if (fileType.includes("pdf") || fileType.includes("document")) return FileText;
  if (fileType.includes("video")) return Video;
  if (fileType.includes("image")) return Image;
  if (fileType.includes("audio")) return Music;
  return File;
};

export const PresentationMode = ({
  isOpen,
  onClose,
  evidence,
  initialIndex = 0,
  caseNumber,
}: PresentationModeProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const currentEvidence = evidence[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setCurrentIndex((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setCurrentIndex((i) => Math.min(evidence.length - 1, i + 1));
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, evidence.length, onClose]);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  if (!isOpen || !currentEvidence) return null;

  const FileIcon = getFileIcon(currentEvidence.fileType);
  const isImage = currentEvidence.fileType.includes("image");
  const isVideo = currentEvidence.fileType.includes("video");
  const isSealed = currentEvidence.status === "immutable";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-6 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 text-lg px-4 py-1">
                Case #{caseNumber}
              </Badge>
              <span className="text-white/60">|</span>
              <span className="text-white/80 text-lg">
                Evidence {currentIndex + 1} of {evidence.length}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/10"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="absolute inset-0 flex items-center justify-center p-20">
          <motion.div
            key={currentEvidence.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "relative max-w-5xl w-full aspect-video rounded-2xl overflow-hidden",
              isSealed 
                ? "ring-4 ring-emerald-500/50 shadow-[0_0_60px_-10px_rgba(16,185,129,0.5)]" 
                : "ring-2 ring-amber-500/50 ring-dashed shadow-[0_0_60px_-10px_rgba(245,158,11,0.5)]"
            )}
          >
            {/* Content */}
            {isImage && currentEvidence.fileUrl ? (
              <img
                src={currentEvidence.fileUrl}
                alt={currentEvidence.fileName}
                className="w-full h-full object-contain bg-black"
              />
            ) : isVideo && currentEvidence.fileUrl ? (
              <video
                src={currentEvidence.fileUrl}
                controls
                className="w-full h-full object-contain bg-black"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-secondary/50">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 rounded-full bg-background/50 flex items-center justify-center mx-auto">
                    <FileIcon className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <p className="text-xl text-white/80">{currentEvidence.fileName}</p>
                </div>
              </div>
            )}

            {/* Status Badge */}
            <div className="absolute top-4 right-4">
              {isSealed ? (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-base px-4 py-2">
                  <Lock className="w-4 h-4 mr-2" />
                  Immutable / Juridical Finality
                </Badge>
              ) : (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-base px-4 py-2 animate-pulse">
                  Evidence Presented - Awaiting Judicial Seal
                </Badge>
              )}
            </div>

            {/* Seal Indicator */}
            {isSealed && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                className="absolute bottom-4 left-4"
              >
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 backdrop-blur">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Digitally Sealed</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Navigation */}
        {evidence.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30"
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentIndex((i) => Math.min(evidence.length - 1, i + 1))}
              disabled={currentIndex === evidence.length - 1}
              className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30"
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          </>
        )}

        {/* Footer Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          <div className="max-w-5xl mx-auto">
            <h3 className="text-2xl font-semibold text-white mb-2">{currentEvidence.fileName}</h3>
            <div className="flex items-center gap-6 text-white/60">
              <span>Uploaded by {currentEvidence.uploadedBy}</span>
              <span>•</span>
              <span>{new Date(currentEvidence.uploadedAt).toLocaleString("en-IN")}</span>
              {currentEvidence.signedBy && (
                <>
                  <span>•</span>
                  <span className="text-emerald-400">
                    Sealed by {currentEvidence.signedBy}
                  </span>
                </>
              )}
            </div>
            {currentEvidence.hash && (
              <div className="mt-3 p-2 rounded bg-white/5 inline-block">
                <p className="font-mono text-sm text-primary/80">
                  SHA-256: {currentEvidence.hash}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Thumbnail Strip */}
        {evidence.length > 1 && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2 p-2 rounded-xl bg-black/50 backdrop-blur">
            {evidence.map((e, i) => {
              const Icon = getFileIcon(e.fileType);
              return (
                <button
                  key={e.id}
                  onClick={() => setCurrentIndex(i)}
                  className={cn(
                    "w-16 h-12 rounded-lg overflow-hidden transition-all",
                    i === currentIndex 
                      ? "ring-2 ring-primary scale-110" 
                      : "opacity-50 hover:opacity-80"
                  )}
                >
                  {e.thumbnailUrl || (e.fileType.includes("image") && e.fileUrl) ? (
                    <img
                      src={e.thumbnailUrl || e.fileUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-secondary flex items-center justify-center">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
