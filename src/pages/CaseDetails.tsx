import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Scale, User, Calendar, FileText, Users, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ChainOfCustody } from "@/components/cases/ChainOfCustody";
import { EvidenceCard } from "@/components/cases/EvidenceCard";
import { SignatureModal } from "@/components/cases/SignatureModal";
import { EvidencePreviewModal } from "@/components/cases/EvidencePreviewModal";
import { EmptyVault } from "@/components/cases/EmptyVault";
import { AuthorizedPersonnel } from "@/components/cases/AuthorizedPersonnel";
import { CaseUploadZone } from "@/components/cases/CaseUploadZone";
import { mockCases, mockEvidence, mockCustodyEvents, mockAuthorizedPersons } from "@/data/mockCases";
import { Evidence, EvidenceType } from "@/types/case";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CaseDetails = () => {
  const { id } = useParams<{ id: string }>();
  const caseFile = mockCases.find((c) => c.id === id);
  const [evidence, setEvidence] = useState<Evidence[]>(mockEvidence[id || "1"] || []);
  const custodyEvents = mockCustodyEvents[id || "1"] || [];
  const authorizedPersons = mockAuthorizedPersons[id || "1"] || [];

  const [signModalOpen, setSignModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);

  if (!caseFile) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Case not found</p>
      </div>
    );
  }

  const handleSign = (ev: Evidence) => {
    setSelectedEvidence(ev);
    setSignModalOpen(true);
  };

  const handlePreview = (ev: Evidence) => {
    setSelectedEvidence(ev);
    setPreviewModalOpen(true);
  };

  const handleSignComplete = (ev: Evidence, hash: string) => {
    setEvidence((prev) =>
      prev.map((e) =>
        e.id === ev.id
          ? { ...e, status: "immutable", hash, signedBy: "Officer A. Verma", signedAt: new Date().toISOString() }
          : e
      )
    );
    toast.success("Evidence locked on-chain successfully");
  };

  const handleUpload = (files: File[], type: EvidenceType) => {
    const newEvidence: Evidence[] = files.map((file, i) => ({
      id: `new-${Date.now()}-${i}`,
      caseId: caseFile.id,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      type,
      status: "draft",
      uploadedBy: "Officer A. Verma",
      uploadedAt: new Date().toISOString(),
    }));
    setEvidence((prev) => [...newEvidence, ...prev]);
    toast.success(`${files.length} file(s) uploaded as draft`);
  };

  const statusConfig = {
    open: { label: "Open", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    closed: { label: "Closed", className: "bg-muted text-muted-foreground border-muted" },
    pending: { label: "Pending", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  };
  const status = statusConfig[caseFile.status];

  const groupedEvidence = evidence.reduce((acc, ev) => {
    if (!acc[ev.type]) acc[ev.type] = [];
    acc[ev.type].push(ev);
    return acc;
  }, {} as Record<EvidenceType, Evidence[]>);

  const typeLabels: Record<EvidenceType, string> = {
    forensic: "Forensic Reports",
    cctv: "CCTV Footage",
    witness: "Witness Statements",
    document: "Documents",
    audio: "Audio Recordings",
    other: "Other",
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to="/dashboard">
        <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Cases
        </Button>
      </Link>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-sm font-mono text-muted-foreground mb-1">{caseFile.caseNumber}</p>
            <h1 className="text-2xl font-bold">{caseFile.title}</h1>
          </div>
          <Badge variant="outline" className={cn("text-sm", status.className)}>{status.label}</Badge>
        </div>
        <p className="text-muted-foreground mb-4">{caseFile.description}</p>
        <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><Scale className="w-4 h-4" /><span>{caseFile.courtName}</span></div>
          <div className="flex items-center gap-2"><User className="w-4 h-4" /><span>{caseFile.presidingJudge}</span></div>
          <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /><span>Updated {new Date(caseFile.updatedAt).toLocaleDateString("en-IN")}</span></div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <Tabs defaultValue="evidence" className="space-y-6">
            <TabsList className="bg-secondary/30 border border-white/5">
              <TabsTrigger value="overview" className="data-[state=active]:bg-primary/20"><LayoutGrid className="w-4 h-4 mr-2" />Overview</TabsTrigger>
              <TabsTrigger value="evidence" className="data-[state=active]:bg-primary/20"><FileText className="w-4 h-4 mr-2" />Evidence Vault</TabsTrigger>
              <TabsTrigger value="personnel" className="data-[state=active]:bg-primary/20"><Users className="w-4 h-4 mr-2" />Personnel</TabsTrigger>
            </TabsList>

            <TabsContent value="overview"><ChainOfCustody events={custodyEvents} /></TabsContent>

            <TabsContent value="evidence" className="space-y-8">
              {evidence.length === 0 ? (
                <EmptyVault />
              ) : (
                Object.entries(groupedEvidence).map(([type, items]) => (
                  <div key={type}>
                    <h3 className="text-lg font-semibold mb-4">{typeLabels[type as EvidenceType]}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {items.map((ev, idx) => (
                        <EvidenceCard key={ev.id} evidence={ev} index={idx} onSign={handleSign} onPreview={handlePreview} />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="personnel"><AuthorizedPersonnel personnel={authorizedPersons} /></TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <CaseUploadZone onUpload={handleUpload} />
          <ChainOfCustody events={custodyEvents.slice(0, 3)} />
        </div>
      </div>

      <SignatureModal open={signModalOpen} onOpenChange={setSignModalOpen} evidence={selectedEvidence} onSign={handleSignComplete} />
      <EvidencePreviewModal open={previewModalOpen} onOpenChange={setPreviewModalOpen} evidence={selectedEvidence} />
    </div>
  );
};

export default CaseDetails;
