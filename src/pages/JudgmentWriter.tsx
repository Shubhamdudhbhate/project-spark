import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  PenLine,
  Save,
  Download,
  FileText,
  CheckCircle2,
  AlertCircle,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Printer,
  Send,
  Scale,
  BookOpen,
  Bookmark,
  Quote,
} from "lucide-react";
import { NyaySutraSidebar } from "@/components/dashboard/NyaySutraSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DraftJudgment {
  id: string;
  caseNumber: string;
  parties: string;
  lastEdited: Date;
  progress: number;
  status: "draft" | "review" | "finalized";
}

const judgmentTemplates = [
  { id: "civil", name: "Civil Suit Judgment", icon: FileText },
  { id: "criminal", name: "Criminal Case Order", icon: Scale },
  { id: "writ", name: "Writ Petition Order", icon: BookOpen },
  { id: "bail", name: "Bail Application Order", icon: Bookmark },
];

const recentCitations = [
  "State of Maharashtra vs. Dhananjay Chatterjee (AIR 1994 SC 2310)",
  "Maneka Gandhi vs. Union of India (1978 AIR 597)",
  "Kesavananda Bharati vs. State of Kerala (1973 4 SCC 225)",
  "Vishaka vs. State of Rajasthan (AIR 1997 SC 3011)",
];

const JudgmentWriter = () => {
  const [selectedDraft, setSelectedDraft] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const [drafts] = useState<DraftJudgment[]>([
    {
      id: "1",
      caseNumber: "WP/1024/2025",
      parties: "Aarav Tech vs. State of Maharashtra",
      lastEdited: new Date(),
      progress: 65,
      status: "draft",
    },
    {
      id: "2",
      caseNumber: "BAIL/502/2025",
      parties: "State vs. Sharma",
      lastEdited: new Date(Date.now() - 86400000),
      progress: 90,
      status: "review",
    },
    {
      id: "3",
      caseNumber: "CS/789/2024",
      parties: "Mehta Industries vs. Global Corp",
      lastEdited: new Date(Date.now() - 172800000),
      progress: 100,
      status: "finalized",
    },
  ]);

  // Auto-save functionality
  useEffect(() => {
    const autoSave = setInterval(() => {
      if (content && selectedDraft) {
        handleSave(true);
      }
    }, 30000);

    return () => clearInterval(autoSave);
  }, [content, selectedDraft]);

  const handleSave = async (isAutoSave = false) => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLastSaved(new Date());
    setIsSaving(false);
    if (!isAutoSave) {
      toast.success("Draft saved successfully");
    }
  };

  const insertCitation = (citation: string) => {
    setContent((prev) => prev + `\n\n"${citation}"\n\n`);
    toast.success("Citation inserted");
  };

  const getStatusBadge = (status: DraftJudgment["status"]) => {
    switch (status) {
      case "draft":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Draft</Badge>;
      case "review":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Under Review</Badge>;
      case "finalized":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Finalized</Badge>;
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <NyaySutraSidebar />

      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <PenLine className="h-8 w-8 text-primary" />
              Judgment Writer
            </h1>
            <p className="text-muted-foreground mt-1">Draft, review, and finalize judicial orders</p>
          </div>
          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                {isSaving ? (
                  <>
                    <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Saved {format(lastSaved, "h:mm a")}
                  </>
                )}
              </span>
            )}
            <Button variant="outline" onClick={() => handleSave()}>
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button>
              <Send className="h-4 w-4 mr-2" />
              Finalize
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Draft List */}
          <div className="col-span-3">
            <Card className="card-glass border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  Pending Judgments
                  <Badge variant="outline">{drafts.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="space-y-1 p-2">
                    {drafts.map((draft) => (
                      <motion.button
                        key={draft.id}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => setSelectedDraft(draft.id)}
                        className={cn(
                          "w-full p-3 rounded-lg text-left transition-all",
                          selectedDraft === draft.id
                            ? "bg-primary/10 border border-primary/30"
                            : "hover:bg-muted/50"
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-medium text-sm">{draft.caseNumber}</span>
                          {getStatusBadge(draft.status)}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 truncate">{draft.parties}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 mr-3">
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${draft.progress}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">{draft.progress}%</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Templates */}
            <Card className="card-glass border-border/50 mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Templates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {judgmentTemplates.map((template) => (
                  <Button
                    key={template.id}
                    variant="ghost"
                    className="w-full justify-start text-sm"
                    onClick={() => toast.info(`${template.name} template loaded`)}
                  >
                    <template.icon className="h-4 w-4 mr-2" />
                    {template.name}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Editor */}
          <div className="col-span-6">
            <Card className="card-glass border-border/50 h-full">
              <CardHeader className="pb-3 border-b border-border/50">
                {/* Toolbar */}
                <div className="flex items-center gap-1 flex-wrap">
                  <Button variant="ghost" size="sm">
                    <Undo className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Redo className="h-4 w-4" />
                  </Button>
                  <Separator orientation="vertical" className="h-6 mx-2" />
                  <Button variant="ghost" size="sm">
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Underline className="h-4 w-4" />
                  </Button>
                  <Separator orientation="vertical" className="h-6 mx-2" />
                  <Button variant="ghost" size="sm">
                    <AlignLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <AlignCenter className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <AlignRight className="h-4 w-4" />
                  </Button>
                  <Separator orientation="vertical" className="h-6 mx-2" />
                  <Button variant="ghost" size="sm">
                    <List className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <ListOrdered className="h-4 w-4" />
                  </Button>
                  <Separator orientation="vertical" className="h-6 mx-2" />
                  <Select defaultValue="normal">
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="heading1">Heading 1</SelectItem>
                      <SelectItem value="heading2">Heading 2</SelectItem>
                      <SelectItem value="heading3">Heading 3</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <Input
                  placeholder="Enter judgment title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xl font-semibold mb-4 border-0 border-b rounded-none px-0 focus-visible:ring-0"
                />
                <Textarea
                  placeholder="Start writing your judgment..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[calc(100vh-400px)] resize-none border-0 focus-visible:ring-0 text-base leading-relaxed"
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Citations & Tools */}
          <div className="col-span-3">
            <Tabs defaultValue="citations" className="h-full">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="citations">Citations</TabsTrigger>
                <TabsTrigger value="tools">Tools</TabsTrigger>
              </TabsList>
              
              <TabsContent value="citations" className="mt-4">
                <Card className="card-glass border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Quote className="h-4 w-4" />
                      Recent Citations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {recentCitations.map((citation, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        className="w-full justify-start text-xs text-left h-auto py-2 px-3"
                        onClick={() => insertCitation(citation)}
                      >
                        <Quote className="h-3 w-3 mr-2 flex-shrink-0" />
                        <span className="truncate">{citation}</span>
                      </Button>
                    ))}
                    <Button variant="outline" className="w-full mt-3" size="sm">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Browse All Citations
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tools" className="mt-4 space-y-4">
                <Card className="card-glass border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <Printer className="h-4 w-4 mr-2" />
                      Print Preview
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export as PDF
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Export as DOCX
                    </Button>
                  </CardContent>
                </Card>

                <Card className="card-glass border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                      Writing Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-xs text-muted-foreground space-y-2">
                      <li>• Begin with case identification and parties</li>
                      <li>• State the issues clearly</li>
                      <li>• Summarize arguments from both sides</li>
                      <li>• Cite relevant precedents</li>
                      <li>• End with clear operative order</li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default JudgmentWriter;
