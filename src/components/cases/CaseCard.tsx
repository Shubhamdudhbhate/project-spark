// src/components/cases/CaseCard.tsx
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  FolderOpen, 
  Scale, 
  User, 
  Calendar, 
  FileText,
  ChevronRight 
} from "lucide-react";
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
  const updatedDate = new Date(caseData.updatedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="group"
    >
      <Link
        to={`/cases/${caseData.id}`}
        className={cn(
          "block p-6 bg-card border rounded-xl hover:border-primary/30 transition-colors",
          "hover:shadow-md dark:hover:shadow-primary/10",
          "h-full flex flex-col"
        )}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold line-clamp-1">
              {caseData.title}
            </h3>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-medium",
              status.className
            )}
          >
            {status.label}
          </Badge>
        </div>

        <div className="space-y-3 mt-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">{caseData.caseNumber}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Scale className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">{caseData.courtName}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <User className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">{caseData.presidingJudge}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{updatedDate}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {caseData.evidenceCount} evidence items
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>
    </motion.div>
  );
};