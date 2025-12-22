// src/pages/MyCases.tsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, FolderOpen, Scale, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CaseCard } from "@/components/cases/CaseCard";
import { CreateCaseModal } from "@/components/cases/create-case-modal";
import { mockCases } from "@/data/mockCases";
import { getCases } from "@/services/caseService";
import { CaseFile } from "@/types/case";

const MyCases = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [courtFilter, setCourtFilter] = useState<string>("all");
  const [allCases, setAllCases] = useState<CaseFile[]>([]);
  const [loading, setLoading] = useState(true);

  // Load cases from localStorage and combine with mock data
  useEffect(() => {
    const loadCases = async () => {
      try {
        const storedCases = await getCases();
        const combined = [...mockCases, ...storedCases];
        setAllCases(combined);
      } catch (error) {
        console.error("Error loading cases:", error);
        setAllCases(mockCases);
      } finally {
        setLoading(false);
      }
    };
    loadCases();
  }, []);

  // Get unique courts for filter
  const uniqueCourts = [...new Set(allCases.map(c => c.courtName))];

  // Filter cases
  const filteredCases = allCases.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.courtName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesCourt = courtFilter === "all" || c.courtName === courtFilter;
    
    return matchesSearch && matchesStatus && matchesCourt;
  });

  const stats = {
    total: allCases.length,
    active: allCases.filter(c => c.status === 'active').length,
    pending: allCases.filter(c => c.status === 'pending').length,
    closed: allCases.filter(c => c.status === 'closed').length,
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
          {/* Title & Action */}
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Scale className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Case Management</h1>
              <p className="text-muted-foreground text-sm">
                {stats.total} total cases • {stats.active} active
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">{stats.active} Active</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-400">{stats.pending} Pending</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 border border-white/10">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">{stats.closed} Closed</span>
            </div>
            <CreateCaseModal />
          </div>
        </div>
      </motion.div>

      {/* Search and Filters - Horizontal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by case title, number, or court..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary/30 border-white/10"
          />
        </div>
        <Select value={courtFilter} onValueChange={setCourtFilter}>
          <SelectTrigger className="w-full sm:w-[200px] bg-secondary/30 border-white/10">
            <SelectValue placeholder="All Courts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courts</SelectItem>
            {uniqueCourts.map((court) => (
              <SelectItem key={court} value={court}>{court}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px] bg-secondary/30 border-white/10">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Cases Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredCases.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {filteredCases.map((caseItem, index) => (
            <motion.div
              key={caseItem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
            >
              <CaseCard caseData={caseItem} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center glass-card"
        >
          <FolderOpen className="w-16 h-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No cases found</h3>
          <p className="text-muted-foreground mt-1 max-w-sm">
            {searchQuery || statusFilter !== "all" || courtFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Create your first case to get started"}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default MyCases;