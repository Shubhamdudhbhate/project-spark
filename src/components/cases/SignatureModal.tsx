import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Key,
  Loader2,
  CheckCircle2,
  Lock,
  Fingerprint,
} from "lucide-react";
import { Evidence } from "@/types/case";

interface SignatureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evidence: Evidence | null;
  onSign: (evidence: Evidence, hash: string) => void;
}

type SigningStep = "confirm" | "signing" | "hashing" | "success";

export const SignatureModal = ({
  open,
  onOpenChange,
  evidence,
  onSign,
}: SignatureModalProps) => {
  const [step, setStep] = useState<SigningStep>("confirm");

  const handleSign = async () => {
    if (!evidence) return;

    setStep("signing");
    
    // Simulate wallet signing
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setStep("hashing");
    
    // Simulate hashing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Generate mock hash
    const hash = `0x${Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("")}`;
    
    setStep("success");
    
    // Wait for success animation
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    onSign(evidence, hash);
    setStep("confirm");
    onOpenChange(false);
  };

  const handleClose = () => {
    if (step === "confirm" || step === "success") {
      setStep("confirm");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass-card border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            Digital Signature
          </DialogTitle>
          <DialogDescription>
            Sign evidence with your private key to lock it on-chain
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 py-4"
            >
              {evidence && (
                <div className="p-4 rounded-lg bg-secondary/30 border border-white/5">
                  <p className="text-sm text-muted-foreground mb-1">File</p>
                  <p className="font-medium truncate">{evidence.fileName}</p>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Fingerprint className="w-5 h-5 text-primary" />
                  <span>Your identity will be verified via Gov-ID</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Lock className="w-5 h-5 text-primary" />
                  <span>File hash will be stored on-chain immutably</span>
                </div>
              </div>

              <Button
                onClick={handleSign}
                className="w-full glow-button bg-primary hover:bg-primary/90"
              >
                <Key className="w-4 h-4 mr-2" />
                Sign with Private Key
              </Button>
            </motion.div>
          )}

          {step === "signing" && (
            <motion.div
              key="signing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-12 flex flex-col items-center gap-4"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl animate-pulse" />
                <Loader2 className="relative w-16 h-16 text-primary animate-spin" />
              </div>
              <p className="text-lg font-medium">Awaiting Wallet Signature...</p>
              <p className="text-sm text-muted-foreground">
                Please confirm in your wallet
              </p>
            </motion.div>
          )}

          {step === "hashing" && (
            <motion.div
              key="hashing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-12 flex flex-col items-center gap-4"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500/20 blur-xl animate-pulse" />
                <Shield className="relative w-16 h-16 text-amber-400 animate-pulse" />
              </div>
              <p className="text-lg font-medium">Computing File Hash...</p>
              <p className="text-sm text-muted-foreground">
                AES-256 encryption in progress
              </p>
              
              {/* Scanning effect */}
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mt-4">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary via-amber-400 to-primary"
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
              </div>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="py-12 flex flex-col items-center gap-4"
            >
              {/* Wax seal animation */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-emerald-500/30 blur-2xl" />
                <div className="relative p-6 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                
                {/* Seal ring */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.2, opacity: 0 }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="absolute inset-0 rounded-full border-2 border-emerald-400"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <p className="text-xl font-bold text-emerald-400 mb-1">
                  Evidence Secured
                </p>
                <p className="text-sm text-muted-foreground">
                  Hash locked on blockchain
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
