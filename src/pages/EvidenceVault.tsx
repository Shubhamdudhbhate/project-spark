import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Archive,
  Search,
  Filter,
  Upload,
  FileText,
  Image,
  Video,
  AudioLines,
  File,
  Lock,
  Unlock,
  Eye,
  Download,
  Trash2,
  FolderOpen,
  Clock,
  Grid3X3,
  List,
} from "lucide-react";
import { NyaySutraSidebar } from "@/components/dashboard/NyaySutraSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Evidence {
  id: string;
  title: string;
  fileName: string;
  category: "document" | "video" | "audio" | "image" | "other";
  caseNumber: string;
  uploadedAt: Date;
  uploadedBy: string;
  isSealed: boolean;
  fileSize: string;
}

const EvidenceVault = () => {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    fetchEvidence();
  }, []);

  const fetchEvidence = async () => {
    try {
      const { data, error } = await supabase
        .from("evidence")
        .select(`
          id,
          title,
          file_name,
          category,
          created_at,
          is_sealed,
          file_size,
          case:cases!evidence_case_id_fkey(case_number),
          uploader:profiles!evidence_uploaded_by_fkey(full_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedEvidence: Evidence[] = (data || []).map((e) => ({
        id: e.id,
        title: e.title,
        fileName: e.file_name,
        category: e.category as Evidence["category"],
        caseNumber: e.case?.case_number || "Unknown",
        uploadedAt: new Date(e.created_at),
        uploadedBy: e.uploader?.full_name || "Unknown",
        isSealed: e.is_sealed || false,
        fileSize: formatFileSize(e.file_size || 0),
      }));

      setEvidence(formattedEvidence);
    } catch (error) {
      console.error("Error fetching evidence:", error);
      toast.error("Failed to load evidence");
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getCategoryIcon = (category: Evidence["category"]) => {
    switch (category) {
      case "document":
        return <FileText className="h-5 w-5 text-blue-400" />;
      case "video":
        return <Video className="h-5 w-5 text-purple-400" />;
      case "audio":
        return <AudioLines className="h-5 w-5 text-amber-400" />;
      case "image":
        return <Image className="h-5 w-5 text-emerald-400" />;
      default:
        return <File className="h-5 w-5 text-slate-400" />;
    }
  };

  const filteredEvidence = evidence.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || e.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: evidence.length,
    documents: evidence.filter((e) => e.category === "document").length,
    media: evidence.filter((e) => ["video", "audio", "image"].includes(e.category)).length,
    sealed: evidence.filter((e) => e.isSealed).length,
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <NyaySutraSidebar />

      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Archive className="h-8 w-8 text-primary" />
              Evidence Vault
            </h1>
            <p className="text-muted-foreground mt-1">Secure repository for all case evidence</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90">
            <Upload className="h-4 w-4 mr-2" />
            Upload Evidence
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="card-glass border-border/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <FolderOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Files</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-glass border-border/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.documents}</p>
                <p className="text-sm text-muted-foreground">Documents</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-glass border-border/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/10">
                <Video className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.media}</p>
                <p className="text-sm text-muted-foreground">Media Files</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-glass border-border/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10">
                <Lock className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.sealed}</p>
                <p className="text-sm text-muted-foreground">Sealed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="card-glass border-border/50 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, case number, or file name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-muted/50 border-border"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-48 bg-muted/50 border-border">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center border border-border rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(viewMode === "grid" && "bg-muted")}
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(viewMode === "list" && "bg-muted")}
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Evidence Grid/List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filteredEvidence.length === 0 ? (
          <Card className="card-glass border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Archive className="h-12 w-12 mb-4 opacity-50" />
              <p>No evidence found</p>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-4 gap-4">
            {filteredEvidence.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="card-glass border-border/50 hover:border-primary/30 transition-all cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-3 rounded-xl bg-muted/50">
                        {getCategoryIcon(item.category)}
                      </div>
                      {item.isSealed ? (
                        <Lock className="h-4 w-4 text-amber-400" />
                      ) : (
                        <Unlock className="h-4 w-4 text-emerald-400" />
                      )}
                    </div>
                    <h3 className="font-medium text-sm mb-1 truncate">{item.title}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{item.caseNumber}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{item.fileSize}</span>
                      <span>{format(item.uploadedAt, "MMM d")}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="card-glass border-border/50">
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {filteredEvidence.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-muted/50">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{item.title}</span>
                        {item.isSealed && <Lock className="h-3 w-3 text-amber-400" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{item.fileName}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {item.caseNumber}
                    </Badge>
                    <div className="text-sm text-muted-foreground w-24 text-right">
                      {item.fileSize}
                    </div>
                    <div className="text-sm text-muted-foreground w-32">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {format(item.uploadedAt, "MMM d, yyyy")}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default EvidenceVault;
