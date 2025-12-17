import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, Shield, Lock, CheckCircle2, Fingerprint, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Evidence } from "@/types/case";
import { useRole } from "@/contexts/RoleContext";
import { toast } from "@/hooks/use-toast";

interface JudgeActionPanelProps {
  evidence: Evidence;
  caseNumber: string;
  onSeal: (evidence: Evidence, signature: string) => void;
}

type SealStep = "confirm" | "wallet" | "signing" | "success";

export const JudgeActionPanel = ({ evidence, caseNumber, onSeal }: JudgeActionPanelProps) => {
  const { currentUser, hasPermission } = useRole();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<SealStep>("confirm");

  const canSeal = hasPermission("seal_evidence") && evidence.status !== "immutable";

  const handleSealClick = () => {
    if (!hasPermission("seal_evidence")) {
      toast({
        title: "Access Denied",
        description: "Only the Presiding Judge can seal evidence.",
        variant: "destructive",
      });
      return;
    }
    setIsOpen(true);
    setStep("confirm");
  };

  const handleConfirm = async () => {
    setStep("wallet");
    await new Promise((r) => setTimeout(r, 1500));
    setStep("signing");
    await new Promise((r) => setTimeout(r, 2000));
    
    const signature = `0x${Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join("")}`;
    
    setStep("success");
    await new Promise((r) => setTimeout(r, 1500));
    
    onSeal(evidence, signature);
    setIsOpen(false);
    setStep("confirm");
  };

  const handleClose = () => {
    if (step === "confirm" || step === "success") {
      setIsOpen(false);
      setStep("confirm");
    }
  };

  if (!canSeal) return null;

  return (
    <>
      <Button
        onClick={handleSealClick}
        className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-semibold shadow-lg shadow-amber-500/25"
      >
        <Scale className="w-4 h-4 mr-2" />
        ⚖️ Seal Evidence On-Chain
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="glass-card border-amber-500/20 max-w-md">
          <AnimatePresence mode="wait">
            {step === "confirm" && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <DialogHeader>
                  <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                    <Scale className="w-8 h-8 text-amber-400" />
                  </div>
                  <DialogTitle className="text-center text-xl">Judicial Certification</DialogTitle>
                  <DialogDescription className="text-center">
                    You are about to certify and seal this evidence with juridical finality.
                  </DialogDescription>
                </DialogHeader>

                <div className="my-6 p-4 rounded-lg bg-secondary/50 border border-white/5 space-y-2">
                  <p className="text-sm text-muted-foreground">Evidence File</p>
                  <p className="font-medium truncate">{evidence.fileName}</p>
                  <p className="text-sm text-muted-foreground mt-3">Case Reference</p>
                  <p className="font-mono text-amber-400">{caseNumber}</p>
                </div>

                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-200">
                      Do you solemnly certify this evidence for Case #{caseNumber}? This action is irreversible.
                    </p>
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    className="bg-amber-500 hover:bg-amber-600 text-black"
                  >
                    I Certify This Evidence
                  </Button>
                </DialogFooter>
              </motion.div>
            )}

            {step === "wallet" && (
              <motion.div
                key="wallet"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="py-8"
              >
                <div className="text-center space-y-4">
                  <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg">
                    <Fingerprint className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold">Wallet Signature Request</h3>
                  <p className="text-sm text-muted-foreground">
                    Please confirm the transaction in your wallet
                  </p>
                  <div className="mt-6 p-4 rounded-lg bg-secondary border border-white/10">
                    <p className="text-xs text-muted-foreground mb-2">Signing Message</p>
                    <p className="font-mono text-xs break-all text-amber-400">
                      I, {currentUser?.name}, certify evidence "{evidence.fileName}" for Case #{caseNumber}
                    </p>
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="flex justify-center pt-4"
                  >
                    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  </motion.div>
                </div>
              </motion.div>
            )}

            {step === "signing" && (
              <motion.div
                key="signing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="py-8"
              >
                <div className="text-center space-y-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="mx-auto w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center"
                  >
                    <Shield className="w-10 h-10 text-emerald-400" />
                  </motion.div>
                  <h3 className="text-lg font-semibold">Recording On-Chain</h3>
                  <p className="text-sm text-muted-foreground">
                    Generating cryptographic seal and blockchain record...
                  </p>
                  <div className="space-y-2 pt-4">
                    <div className="flex items-center justify-center gap-2 text-sm text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Signature verified</span>
                    </div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="flex items-center justify-center gap-2 text-sm text-emerald-400"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Hash computed</span>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                      className="flex items-center justify-center gap-2 text-sm text-amber-400"
                    >
                      <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                      <span>Broadcasting to network...</span>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="py-8"
              >
                <div className="text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="mx-auto w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center"
                  >
                    <Lock className="w-10 h-10 text-emerald-400" />
                  </motion.div>
                  <h3 className="text-lg font-semibold text-emerald-400">Evidence Sealed</h3>
                  <p className="text-sm text-muted-foreground">
                    Juridical Finality Achieved
                  </p>
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-xs text-emerald-400">
                      This evidence is now immutable and recorded on-chain
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
};
