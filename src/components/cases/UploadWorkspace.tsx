import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  Video,
  Image,
  Music,
  File,
  X,
  Loader2,
  FolderUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UploadWorkspaceProps {
  caseId: string;
  userId: string;
  onUploadComplete: () => void;
}

type EvidenceCategory = "document" | "video" | "audio" | "image" | "forensic" | "other";

const evidenceCategories: { value: EvidenceCategory; label: string; icon: typeof FileText }[] = [
  { value: "document", label: "Documents & Affidavits", icon: FileText },
  { value: "video", label: "CCTV / Video Evidence", icon: Video },
  { value: "audio", label: "Audio Recordings", icon: Music },
  { value: "image", label: "Photographs & Images", icon: Image },
  { value: "forensic", label: "Forensic Reports", icon: File },
  { value: "other", label: "Other Evidence", icon: File },
];

const getFileIcon = (file: File) => {
  const type = file.type;
  if (type.includes("pdf") || type.includes("document")) return FileText;
  if (type.includes("video")) return Video;
  if (type.includes("image")) return Image;
  if (type.includes("audio")) return Music;
  return File;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const UploadWorkspace = ({
  caseId,
  userId,
  onUploadComplete,
}: UploadWorkspaceProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [category, setCategory] = useState<EvidenceCategory>("document");
  const [batchTitle, setBatchTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Please select files to upload");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const totalFiles = files.length;
    let uploadedCount = 0;
    let successCount = 0;

    for (const file of files) {
      try {
        // Generate unique file path
        const fileExt = file.name.split(".").pop();
        const fileName = `${caseId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

        // Upload to storage
        const { error: storageError } = await supabase.storage
          .from("evidence")
          .upload(fileName, file);

        if (storageError) {
          console.error("Storage error:", storageError);
          toast.error(`Failed to upload ${file.name}`);
          uploadedCount++;
          setUploadProgress((uploadedCount / totalFiles) * 100);
          continue;
        }

        // Get signed URL for private bucket (valid for 1 year)
        const { data: urlData, error: urlError } = await supabase.storage
          .from("evidence")
          .createSignedUrl(fileName, 60 * 60 * 24 * 365);

        if (urlError || !urlData?.signedUrl) {
          console.error("URL error:", urlError);
          toast.error(`Failed to generate URL for ${file.name}`);
          uploadedCount++;
          setUploadProgress((uploadedCount / totalFiles) * 100);
          continue;
        }

        // Create evidence record - match actual database schema
        const evidenceTitle = batchTitle
          ? `${batchTitle} - ${file.name}`
          : file.name.replace(/\.[^/.]+$/, "");

        const { error: dbError } = await supabase.from("evidence").insert({
          case_id: caseId,
          title: evidenceTitle,
          file_name: file.name,
          file_url: urlData.signedUrl,
          mime_type: file.type,
          file_size: file.size,
          uploaded_by: userId,
          category: category === "forensic" ? "other" : category as "document" | "video" | "audio" | "image" | "other",
        });

        if (dbError) {
          console.error("Database error:", dbError);
          toast.error(`Failed to save ${file.name} record`);
        } else {
          // Log the upload action - fetch the evidence ID first
          const { data: evidenceRecord } = await supabase
            .from("evidence")
            .select("id")
            .eq("file_url", urlData.signedUrl)
            .maybeSingle();

          if (evidenceRecord) {
            await supabase.from("chain_of_custody").insert({
              evidence_id: evidenceRecord.id,
              action: "UPLOADED",
              performed_by: userId,
              details: {
                file_name: file.name,
                file_size: file.size,
                category: category,
              },
            });
          }
          successCount++;
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(`Error uploading ${file.name}`);
      }

      uploadedCount++;
      setUploadProgress((uploadedCount / totalFiles) * 100);
    }

    setIsUploading(false);
    setFiles([]);
    setBatchTitle("");

    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} file(s)`);
      onUploadComplete();
    }
  };

  return (
    <div className="glass-card p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
          <FolderUp className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Upload Workspace</h3>
          <p className="text-xs text-muted-foreground">
            Batch upload evidence files for judicial review
          </p>
        </div>
      </div>

      {/* Category Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Evidence Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as EvidenceCategory)}>
            <SelectTrigger className="bg-secondary/30 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {evidenceCategories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {cat.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Batch Title (Optional)</Label>
          <Input
            value={batchTitle}
            onChange={(e) => setBatchTitle(e.target.value)}
            placeholder="e.g., CCTV Footage - Building A"
            className="bg-secondary/30 border-white/10"
          />
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 transition-all duration-300",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-white/10 hover:border-white/20",
          isUploading && "pointer-events-none opacity-50"
        )}
      >
        <input
          type="file"
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept="*/*"
          disabled={isUploading}
        />

        <div className="flex flex-col items-center gap-3">
          <div
            className={cn(
              "p-4 rounded-xl transition-all",
              isDragging ? "bg-primary/20" : "bg-secondary/30"
            )}
          >
            <Upload
              className={cn(
                "w-8 h-8 transition-colors",
                isDragging ? "text-primary" : "text-muted-foreground"
              )}
            />
          </div>
          <div className="text-center">
            <p className="font-medium">
              {isDragging ? "Drop files here" : "Drag & drop multiple files"}
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse your device
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Supports PDF, DOCX, MP4, MP3, JPG, PNG, and more
          </p>
        </div>
      </div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && !isUploading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{files.length} file(s) selected</span>
              <Button variant="ghost" size="sm" onClick={() => setFiles([])}>
                Clear All
              </Button>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {files.map((file, index) => {
                const Icon = getFileIcon(file);
                return (
                  <motion.div
                    key={`${file.name}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-white/5"
                  >
                    <Icon className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                );
              })}
            </div>

            <Button
              onClick={handleUpload}
              className="w-full glow-button bg-primary hover:bg-primary/90"
              disabled={isUploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload {files.length} {files.length === 1 ? "File" : "Files"} for Review
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Progress */}
      {isUploading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm">Uploading files...</span>
          </div>
          <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${uploadProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-center text-xs text-muted-foreground">
            {Math.round(uploadProgress)}% complete
          </p>
        </motion.div>
      )}

      {/* Status Note */}
      <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
        <p className="text-xs text-amber-400">
          <strong>Note:</strong> All uploaded files will remain in "Pending Review" status
          until sealed by the presiding Judge.
        </p>
      </div>
    </div>
  );
};
