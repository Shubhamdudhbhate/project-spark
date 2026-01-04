import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Video,
  FileText,
  ChevronRight,
  Gavel,
  Clock,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface CauseListItem {
  id: string;
  srNo: number;
  caseNumber: string;
  parties: string;
  caseType: string;
  stage: string;
  status: "scheduled" | "in-progress" | "completed" | "adjourned";
  time?: string;
  isUrgent?: boolean;
}

interface LiveCauseListProps {
  items: CauseListItem[];
  currentHearingId: string | null;
  onStartHearing: (id: string) => void;
  onOpenCaseFile: (id: string) => void;
  onVideoCall: (id: string) => void;
  onPassOrder: (id: string) => void;
}

export const LiveCauseList = ({
  items,
  currentHearingId,
  onStartHearing,
  onOpenCaseFile,
  onVideoCall,
  onPassOrder,
}: LiveCauseListProps) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const getStatusBadge = (item: CauseListItem) => {
    const isCurrentHearing = item.id === currentHearingId;

    if (isCurrentHearing) {
      return (
        <Badge className="badge-live gap-1.5 animate-live-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          Live
        </Badge>
      );
    }

    switch (item.status) {
      case "in-progress":
        return <Badge className="badge-active">In Progress</Badge>;
      case "completed":
        return <Badge variant="secondary">Completed</Badge>;
      case "adjourned":
        return <Badge variant="outline">Adjourned</Badge>;
      default:
        return <Badge className="badge-pending">Scheduled</Badge>;
    }
  };

  const getNextInLine = () => {
    if (!currentHearingId) return items[0]?.id;
    const currentIndex = items.findIndex((i) => i.id === currentHearingId);
    return items[currentIndex + 1]?.id;
  };

  const nextInLineId = getNextInLine();

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Gavel className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Live Cause List</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Today's scheduled hearings
              </p>
            </div>
          </div>
          <Badge variant="outline" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {items.length} Cases
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-16">Sr.</TableHead>
                <TableHead>Case Number</TableHead>
                <TableHead>Parties</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {items.map((item) => {
                  const isCurrentHearing = item.id === currentHearingId;
                  const isNextInLine = item.id === nextInLineId && !isCurrentHearing;
                  const isExpanded = expandedRow === item.id;

                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={cn(
                        "table-row-hover cursor-pointer",
                        isCurrentHearing && "animate-row-pulse bg-success/5",
                        isNextInLine && "bg-primary/5"
                      )}
                      onClick={() => setExpandedRow(isExpanded ? null : item.id)}
                    >
                      <TableCell className="font-medium">{item.srNo}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium">
                            {item.caseNumber}
                          </span>
                          {item.isUrgent && (
                            <Badge className="badge-urgent text-xs">Urgent</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="max-w-[200px] truncate">{item.parties}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{item.caseType}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {item.stage}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(item)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {!isCurrentHearing && item.status === "scheduled" && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onStartHearing(item.id);
                              }}
                              className="gap-1.5"
                            >
                              <Play className="h-3.5 w-3.5" />
                              Start
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenCaseFile(item.id);
                            }}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              onVideoCall(item.id);
                            }}
                          >
                            <Video className="h-4 w-4" />
                          </Button>
                          {isCurrentHearing && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                onPassOrder(item.id);
                              }}
                              className="gap-1.5"
                            >
                              <Gavel className="h-3.5 w-3.5" />
                              Pass Order
                            </Button>
                          )}
                          <ChevronRight
                            className={cn(
                              "h-4 w-4 text-muted-foreground transition-transform",
                              isExpanded && "rotate-90"
                            )}
                          />
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
