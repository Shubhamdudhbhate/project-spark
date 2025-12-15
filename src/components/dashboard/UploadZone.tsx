import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileCheck, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const UploadZone = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

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
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setUploadedFile(file);
    setIsScanning(true);
    setIsComplete(false);

    // Simulate scanning process
    setTimeout(() => {
      setIsScanning(false);
      setIsComplete(true);
    }, 3000);
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setIsScanning(false);
    setIsComplete(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Upload Evidence</h3>
          <p className="text-sm text-muted-foreground">
            Drag and drop files to secure on blockchain
          </p>
        </div>
        {uploadedFile && (
          <Button variant="ghost" size="sm" onClick={resetUpload}>
            <X className="w-4 h-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative min-h-[250px] rounded-xl border-2 border-dashed transition-all duration-300 flex items-center justify-center overflow-hidden",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-white/10 hover:border-primary/30 bg-secondary/20"
        )}
      >
        {/* Scanner Animation */}
        <AnimatePresence>
          {isScanning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none"
            >
              <div className="scanner-line" />
              <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-primary/10" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="relative z-10 text-center p-8">
          <AnimatePresence mode="wait">
            {!uploadedFile ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="p-4 rounded-2xl bg-primary/10 border border-primary/20 mb-4"
                >
                  <Upload className="w-10 h-10 text-primary" />
                </motion.div>
                <p className="text-lg font-medium mb-2">
                  Drop evidence files here
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to browse from your device
                </p>
                <label>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4,.mov"
                  />
                  <span className="inline-flex items-center px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm font-medium cursor-pointer hover:bg-primary/20 transition-colors">
                    Select File
                  </span>
                </label>
                <p className="text-xs text-muted-foreground mt-4">
                  Supported: PDF, DOCX, JPG, PNG, MP4 (Max 100MB)
                </p>
              </motion.div>
            ) : isScanning ? (
              <motion.div
                key="scanning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="p-4 rounded-2xl bg-primary/10 border border-primary/20 mb-4"
                >
                  <AlertCircle className="w-10 h-10 text-primary" />
                </motion.div>
                <p className="text-lg font-medium mb-2">Scanning & Hashing...</p>
                <p className="text-sm text-muted-foreground">
                  {uploadedFile.name}
                </p>
                <div className="mt-4 w-48 h-1 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="h-full w-1/2 bg-gradient-to-r from-transparent via-primary to-transparent"
                  />
                </div>
              </motion.div>
            ) : isComplete ? (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4"
                >
                  <FileCheck className="w-10 h-10 text-emerald-400" />
                </motion.div>
                <p className="text-lg font-medium text-emerald-400 mb-2">
                  Evidence Secured!
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  {uploadedFile.name}
                </p>
                <code className="font-mono text-xs text-primary/80 bg-primary/5 px-3 py-2 rounded-lg border border-primary/20">
                  0x7f83b165...d9069
                </code>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
