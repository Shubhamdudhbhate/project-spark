import { motion } from "framer-motion";
import { Lock, Database, BadgeCheck } from "lucide-react";

const trustItems = [
  { icon: Lock, label: "AES-256 Encryption", delay: 0.1 },
  { icon: Database, label: "IPFS Storage", delay: 0.2 },
  { icon: BadgeCheck, label: "Gov-ID Verified", delay: 0.3 },
];

export const TrustStrip = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.8 }}
      className="glass-card py-6 px-8"
    >
      <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
        {trustItems.map((item) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.9 + item.delay }}
            className="flex items-center gap-3 text-muted-foreground"
          >
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <item.icon className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-medium tracking-wide">{item.label}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
