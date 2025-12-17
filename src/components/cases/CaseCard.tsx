// src/components/cases/CaseCard.tsx
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Scale, FileText, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CaseFile } from "@/types/case";
import { cn } from "@/lib/utils";

interface CaseCardProps {
  caseData: CaseFile;
}

const statusConfig = {
  open: {
    label: "Open",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  pending: {
    label: "Pending",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  closed: {
    label: "Closed",
    className: "bg-muted text-muted-foreground border-muted",
  },
};

export const CaseCard = ({ caseData }: CaseCardProps) => {
  const status = statusConfig[caseData.status as keyof typeof statusConfig] || statusConfig.open;
  
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="group h-full"
    >
      <Link
        to={`/cases/${caseData.id}`}
        className="block h-full glass-card p-5 hover:border-primary/30 transition-all"
      >
        {/* Header: Status Badge */}
        <div className="flex justify-between items-start mb-3">
          <Badge
            variant="outline"
            className={cn("text-xs font-medium", status.className)}
          >
            {status.label}
          </Badge>
          <span className="text-xs font-mono text-muted-foreground">
            {caseData.caseNumber}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold mb-3 line-clamp-2 min-h-[2.5rem]">
          {caseData.title}
        </h3>

        {/* Info Grid */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Scale className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{caseData.courtName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{caseData.presidingJudge}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/5 flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {caseData.evidenceCount} evidence
          </span>
          <div className="flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            <span>View</span>
            <ChevronRight className="h-3 w-3" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
};