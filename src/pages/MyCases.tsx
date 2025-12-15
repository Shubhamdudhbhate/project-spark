// src/pages/MyCases.tsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CaseCard } from "@/components/cases/CaseCard";
import { CreateCaseModal } from "@/components/cases/create-case-modal";
import { mockCases } from "@/data/mockCases";
import { getCases } from "@/services/caseService";
import { CaseFile } from "@/types/case";

const MyCases = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [allCases, setAllCases] = useState<CaseFile[]>(mockCases);

  useEffect(() => {
    const loadCases = async () => {
      const storedCases = await getCases();
      // Merge stored cases with mock cases, avoiding duplicates
      const mergedCases = [
        ...storedCases,
        ...mockCases.filter(
          (mock) => !storedCases.some((stored) => stored.id === mock.id)
        ),
      ];
      setAllCases(mergedCases);
    };
    loadCases();
  }, []);

  const filteredCases = allCases.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row gap-4 justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Cases</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track your active legal cases
          </p>
        </div>
        <CreateCaseModal />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search cases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary/30 border-white/10"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCases.map((caseItem) => (
          <CaseCard key={caseItem.id} caseData={caseItem} />
        ))}
      </div>
    </div>
  );
};

export default MyCases;
