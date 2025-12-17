import { motion } from "framer-motion";
import { 
  FileText, 
  Upload, 
  PenTool, 
  Lock, 
  User,
  ExternalLink 
} from "lucide-react";
import { CustodyEvent } from "@/types/case";
import { cn } from "@/lib/utils";

interface ChainOfCustodyProps {
  events: CustodyEvent[];
  compact?: boolean;
}

const getEventIcon = (action: string) => {
  if (action.includes("Created")) return FileText;
  if (action.includes("Uploaded")) return Upload;
  if (action.includes("Signed")) return PenTool;
  if (action.includes("Locked")) return Lock;
  return User;
};

const getEventColor = (action: string) => {
  if (action.includes("Created")) return "text-primary bg-primary/10 border-primary/20";
  if (action.includes("Uploaded")) return "text-blue-400 bg-blue-500/10 border-blue-500/20";
  if (action.includes("Signed")) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
  if (action.includes("Locked")) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  return "text-muted-foreground bg-muted/10 border-muted/20";
};

export const ChainOfCustody = ({ events, compact = false }: ChainOfCustodyProps) => {
  if (compact) {
    return (
      <div className="space-y-3">
        {events.map((event) => {
          const Icon = getEventIcon(event.action);
          const colorClass = getEventColor(event.action);
          const timestamp = new Date(event.timestamp).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div key={event.id} className="flex items-start gap-3">
              <div className={cn("p-1.5 rounded-md border", colorClass)}>
                <Icon className="w-3 h-3" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{event.action}</p>
                <p className="text-xs text-muted-foreground">{timestamp}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <Lock className="w-5 h-5 text-primary" />
        Chain of Custody
      </h3>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[23px] top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-primary/20 to-transparent" />

        <div className="space-y-6">
          {events.map((event, index) => {
            const Icon = getEventIcon(event.action);
            const colorClass = getEventColor(event.action);
            const timestamp = new Date(event.timestamp).toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="relative flex gap-4"
              >
                {/* Icon */}
                <div
                  className={cn(
                    "relative z-10 p-2 rounded-lg border",
                    colorClass
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {/* Content */}
                <div className="flex-1 pb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{event.action}</span>
                    <span className="text-xs text-muted-foreground">
                      {timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    by {event.actor}
                  </p>
                  <p className="text-sm text-muted-foreground/70">
                    {event.details}
                  </p>
                  {event.txHash && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs font-mono text-primary/70 bg-primary/5 px-2 py-1 rounded">
                        {event.txHash.slice(0, 10)}...{event.txHash.slice(-8)}
                      </span>
                      <ExternalLink className="w-3 h-3 text-muted-foreground cursor-pointer hover:text-primary transition-colors" />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
