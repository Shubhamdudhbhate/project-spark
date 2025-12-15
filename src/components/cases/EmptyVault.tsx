import { motion } from "framer-motion";
import { Shield, Lock, FileX } from "lucide-react";

export const EmptyVault = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-8"
    >
      {/* Vault illustration */}
      <div className="relative mb-8">
        {/* Outer glow */}
        <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
        
        {/* Vault icon */}
        <div className="relative">
          <motion.div
            animate={{ 
              boxShadow: [
                "0 0 20px rgba(37, 99, 235, 0.2)",
                "0 0 40px rgba(37, 99, 235, 0.3)",
                "0 0 20px rgba(37, 99, 235, 0.2)",
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="p-8 rounded-2xl bg-gradient-to-br from-secondary/50 to-secondary/30 border border-white/10"
          >
            <div className="relative">
              <Shield className="w-20 h-20 text-muted-foreground/50" />
              <motion.div
                initial={{ y: 0 }}
                animate={{ y: [-2, 2, -2] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              >
                <Lock className="w-8 h-8 text-primary/50" />
              </motion.div>
            </div>
          </motion.div>

          {/* Floating particles */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-primary/30"
              style={{
                top: `${20 + i * 30}%`,
                left: i % 2 === 0 ? "-20%" : "110%",
              }}
              animate={{
                y: [-10, 10, -10],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 2 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </div>
      </div>

      {/* Text */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <FileX className="w-5 h-5" />
          <h3 className="text-xl font-semibold">Vault Empty</h3>
        </div>
        <p className="text-muted-foreground/70 max-w-sm">
          No evidence has been uploaded to this case yet. 
          Upload files to begin building a secure, tamper-proof evidence chain.
        </p>
      </div>

      {/* Decorative grid */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="w-full h-full grid-background" />
      </div>
    </motion.div>
  );
};
