import { motion } from "framer-motion";
import { FileText, Clock, Edit3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface JudgmentItem {
  id: string;
  caseNumber: string;
  parties: string;
  hearingDate: string;
  draftProgress: number;
  dueDate?: string;
  isOverdue?: boolean;
}

interface JudgmentQueueProps {
  items: JudgmentItem[];
  onOpenJudgment: (id: string) => void;
}

export const JudgmentQueue = ({ items, onOpenJudgment }: JudgmentQueueProps) => {
  const getProgressColor = (progress: number, isOverdue?: boolean) => {
    if (isOverdue) return "bg-destructive";
    if (progress >= 80) return "bg-success";
    if (progress >= 50) return "bg-warning";
    return "bg-primary";
  };

  return (
    <Card className="border-border/50 h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <FileText className="h-5 w-5 text-warning" />
            </div>
            <div>
              <CardTitle className="text-lg">Judgment Queue</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Pending orders & judgments
              </p>
            </div>
          </div>
          <Badge variant="outline">{items.length} Pending</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          <div className="px-4 pb-4 space-y-3">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "p-4 rounded-lg border bg-card/50 hover:bg-muted/50 transition-colors cursor-pointer",
                  item.isOverdue && "border-destructive/30 bg-destructive/5"
                )}
                onClick={() => onOpenJudgment(item.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium">
                        {item.caseNumber}
                      </span>
                      {item.isOverdue && (
                        <Badge className="badge-urgent text-xs">Overdue</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {item.parties}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Heard: {item.hearingDate}
                      </span>
                      {item.dueDate && (
                        <span className={cn(item.isOverdue && "text-destructive")}>
                          Due: {item.dueDate}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="shrink-0">
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Draft Progress</span>
                    <span className="font-medium">{item.draftProgress}%</span>
                  </div>
                  <Progress
                    value={item.draftProgress}
                    className={cn("h-1.5", getProgressColor(item.draftProgress, item.isOverdue))}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
