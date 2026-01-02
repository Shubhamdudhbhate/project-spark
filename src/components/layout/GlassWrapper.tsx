import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassWrapperProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "card" | "panel";
}

export const GlassWrapper = ({ children, className, variant = "default" }: GlassWrapperProps) => {
  const baseClasses = "backdrop-blur-lg border shadow-xl rounded-2xl";
  
  const variantClasses = {
    default: "bg-white/5 border-white/10",
    card: "bg-white/5 border-white/10 p-6",
    panel: "bg-white/5 border-white/10 p-8",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(baseClasses, variantClasses[variant], className)}
    >
      {children}
    </motion.div>
  );
};

// Glass card utility component
export const GlassCard = ({ children, className, ...props }: { children: ReactNode; className?: string; [key: string]: any }) => {
  return (
    <div
      className={cn(
        "bg-white/5 backdrop-blur-lg border border-white/10 shadow-xl rounded-2xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

