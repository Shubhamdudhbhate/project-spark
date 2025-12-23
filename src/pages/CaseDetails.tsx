import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Scale, 
  Calendar, 
  FileText, 
  Clock,
  Users,
  Shield,
  Presentation as PresentationIcon,
  Folder,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SignatureModal } from "@/components/cases/SignatureModal";
import { EvidencePreviewModal } from "@/components/cases/EvidencePreviewModal";
import { AuthorizedPersonnel } from "@/components/cases/AuthorizedPersonnel";
import { UploadWorkspace } from "@/components/cases/UploadWorkspace";
import { EvidenceVault } from "@/components/cases/EvidenceVault";
import { PresentationMode } from "@/components/cases/PresentationMode";
import { Evidence as LocalEvidence, AuthorizedPerson } from "@/types/case";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Match the actual database schema
type DbCase = {
  id: string;
  case_number: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  filing_date: string;
  next_hearing_date: string | null;
  created_at: string;
  updated_at: string;
  section_id: string;
  judge_id: string;
  clerk_id: string | null;
  plaintiff_id: string;
  defendant_id: string;
};

// Match the actual evidence table schema
type DbEvidence = {
  id: string;
  case_id: string;
  title: string;
  description: string | null;
  file_name: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  thumbnail_url: string | null;
  category: string;
  is_sealed: boolean | null;
  sealed_at: string | null;
  sealed_by: string | null;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
};

type EvidenceWithNames = DbEvidence & {
  uploader_name?: string;
  signer_name?: string;
};

// Helper to parse party ID - handles both profile IDs and manual entries
const parsePartyId = (id: string): { isManual: boolean; value: string } => {
  if (id.startsWith("manual:")) {
    return { isManual: true, value: id.replace("manual:", "") };
  }
  return { isManual: false, value: id };
};

const CaseDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  
  const [caseData, setCaseData] = useState<DbCase | null>(null);
  const [evidence, setEvidence] = useState<EvidenceWithNames[]>([]);
  const [authorizedPersons, setAuthorizedPersons] = useState<AuthorizedPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [signModalOpen, setSignModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [presentationOpen, setPresentationOpen] = useState(false);
  const [presentationIndex, setPresentationIndex] = useState(0);
  const [selectedEvidence, setSelectedEvidence] = useState<LocalEvidence | null>(null);

  const fetchData = async () => {
    if (!id) return;

    try {
      // Fetch case data
      const { data: caseResult, error: caseError } = await supabase
        .from('cases')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (caseError) {
        console.error('Error fetching case:', caseError);
        toast.error('Failed to load case');
        return;
      }

      if (!caseResult) {
        toast.error('Case not found');
        return;
      }

      setCaseData(caseResult);

      // Fetch evidence for this case
      const { data: evidenceResult, error: evidenceError } = await supabase
        .from('evidence')
        .select('*')
        .eq('case_id', id)
        .order('created_at', { ascending: false });

      if (evidenceError) {
        console.error('Error fetching evidence:', evidenceError);
      } else {
        // Fetch user names for evidence uploaders and sealers
        const userIds = [
          ...new Set((evidenceResult || []).flatMap(e => 
            [e.uploaded_by, e.sealed_by].filter(Boolean) as string[]
          ))
        ];

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

        setEvidence((evidenceResult || []).map(e => ({
          ...e,
          uploader_name: profileMap.get(e.uploaded_by) || 'Unknown',
          signer_name: e.sealed_by ? profileMap.get(e.sealed_by) || 'Unknown' : undefined,
        })));
      }

      // Build authorized personnel from case roles
      // Parse plaintiff/defendant to check if they're manual entries
      const plaintiffParsed = parsePartyId(caseResult.plaintiff_id);
      const defendantParsed = parsePartyId(caseResult.defendant_id);
      
      // Only fetch profiles for actual profile IDs
      const profileIdsToFetch = [
        caseResult.judge_id,
        caseResult.clerk_id,
        !plaintiffParsed.isManual ? plaintiffParsed.value : null,
        !defendantParsed.isManual ? defendantParsed.value : null,
      ].filter((id): id is string => id !== null);

      const { data: roleProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, role_category')
        .in('id', profileIdsToFetch);

      if (roleProfiles || plaintiffParsed.isManual || defendantParsed.isManual) {
        const personnel: AuthorizedPerson[] = [];
        
        const findProfile = (userId: string) => roleProfiles?.find(p => p.id === userId);
        
        const judgeProfile = findProfile(caseResult.judge_id);
        if (judgeProfile) {
          personnel.push({
            id: judgeProfile.id,
            name: judgeProfile.full_name,
            role: 'Presiding Judge',
            department: 'Judiciary',
            govId: judgeProfile.id,
          addedAt: caseResult.created_at || new Date().toISOString(),
          });
        }

        if (caseResult.clerk_id) {
          const clerkProfile = findProfile(caseResult.clerk_id);
          if (clerkProfile) {
            personnel.push({
              id: clerkProfile.id,
              name: clerkProfile.full_name,
              role: 'Court Clerk',
              department: 'Registry',
              govId: clerkProfile.id,
              addedAt: caseResult.created_at || new Date().toISOString(),
            });
          }
        }

        // Handle plaintiff - either from profile or manual entry
        if (plaintiffParsed.isManual) {
          personnel.push({
            id: `plaintiff-manual`,
            name: plaintiffParsed.value,
            role: 'Plaintiff',
            department: 'Party',
            govId: 'Manual Entry',
            addedAt: caseResult.created_at || new Date().toISOString(),
          });
        } else {
          const plaintiffProfile = findProfile(plaintiffParsed.value);
          if (plaintiffProfile) {
            personnel.push({
              id: plaintiffProfile.id,
              name: plaintiffProfile.full_name,
              role: 'Plaintiff',
              department: 'Party',
              govId: plaintiffProfile.id,
              addedAt: caseResult.created_at || new Date().toISOString(),
            });
          }
        }

        // Handle defendant - either from profile or manual entry
        if (defendantParsed.isManual) {
          personnel.push({
            id: `defendant-manual`,
            name: defendantParsed.value,
            role: 'Defendant',
            department: 'Party',
            govId: 'Manual Entry',
            addedAt: caseResult.created_at || new Date().toISOString(),
          });
        } else {
          const defendantProfile = findProfile(defendantParsed.value);
          if (defendantProfile) {
            personnel.push({
              id: defendantProfile.id,
              name: defendantProfile.full_name,
              role: 'Defendant',
              department: 'Party',
              govId: defendantProfile.id,
              addedAt: caseResult.created_at || new Date().toISOString(),
            });
          }
        }

        setAuthorizedPersons(personnel);
      }

    } catch (error) {
      console.error('Error loading case:', error);
      toast.error('Failed to load case data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleSign = (ev: EvidenceWithNames) => {
    const transformed: LocalEvidence = {
      id: ev.id,
      caseId: id || '',
      fileName: ev.title,
      fileType: ev.mime_type || 'application/octet-stream',
      fileSize: ev.file_size || 0,
      fileUrl: ev.file_url || undefined,
      type: 'document',
      status: 'pending',
      uploadedBy: ev.uploader_name || 'Unknown',
      uploadedAt: ev.created_at || new Date().toISOString(),
    };
    setSelectedEvidence(transformed);
    setSignModalOpen(true);
  };

  const handleSignComplete = async (ev: LocalEvidence, hash: string) => {
    const { error } = await supabase
      .from('evidence')
      .update({
        is_sealed: true,
        sealed_by: user?.id,
        sealed_at: new Date().toISOString(),
      })
      .eq('id', ev.id);

    if (error) {
      toast.error('Failed to seal evidence');
      return;
    }

    // Log the seal action to chain_of_custody
    if (user?.id) {
      await supabase.from('chain_of_custody').insert({
        evidence_id: ev.id,
        action: 'SEALED',
        performed_by: user.id,
        details: { signature_hash: hash },
      });
    }

    await fetchData();
    toast.success('Evidence sealed with judicial signature');
  };

  const handlePreview = (ev: EvidenceWithNames) => {
    const transformed: LocalEvidence = {
      id: ev.id,
      caseId: id || '',
      fileName: ev.title,
      fileType: ev.mime_type || 'application/octet-stream',
      fileSize: ev.file_size || 0,
      fileUrl: ev.file_url || undefined,
      type: 'document',
      status: ev.is_sealed ? 'immutable' : 'pending',
      uploadedBy: ev.uploader_name || 'Unknown',
      uploadedAt: ev.created_at || new Date().toISOString(),
      signedBy: ev.signer_name,
      signedAt: ev.sealed_at || undefined,
    };
    setSelectedEvidence(transformed);
    setPreviewModalOpen(true);
  };

  const handlePresent = (_ev: EvidenceWithNames, index: number) => {
    setPresentationIndex(index);
    setPresentationOpen(true);
  };

  const canUpload = profile?.role_category === 'judiciary' || profile?.role_category === 'legal_practitioner';
  const isJudge = profile?.role_category === 'judiciary';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Case not found</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const statusConfig: Record<string, { label: string; className: string }> = {
    active: { label: "Active", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    closed: { label: "Closed", className: "bg-muted text-muted-foreground border-muted" },
    pending: { label: "Pending", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    archived: { label: "Archived", className: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  };
  const status = statusConfig[caseData.status || 'pending'] || statusConfig.pending;

  const approvedEvidence = evidence.filter(e => e.is_sealed === true);
  const pendingEvidence = evidence.filter(e => !e.is_sealed);

  // Transform for presentation mode
  const presentableEvidence: LocalEvidence[] = approvedEvidence.map(e => ({
    id: e.id,
    caseId: id || '',
    fileName: e.title,
    fileType: e.mime_type || 'application/octet-stream',
    fileSize: e.file_size || 0,
    fileUrl: e.file_url || undefined,
    type: 'document',
    status: 'immutable',
    uploadedBy: e.uploader_name || 'Unknown',
    uploadedAt: e.created_at || new Date().toISOString(),
    signedBy: e.signer_name,
    signedAt: e.sealed_at || undefined,
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">{caseData.title}</h1>
              <p className="text-sm text-muted-foreground font-mono">{caseData.case_number}</p>
            </div>
            <Badge variant="outline" className={cn("text-xs", status.className)}>
              {status.label}
            </Badge>
            {presentableEvidence.length > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  setPresentationIndex(0);
                  setPresentationOpen(true);
                }}
                className="hidden md:flex border-primary/20 text-primary hover:bg-primary/10"
              >
                <PresentationIcon className="w-4 h-4 mr-2" />
                Present Case
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Case Info */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3 space-y-4"
          >
            {/* Case Info Card */}
            <div className="glass-card p-5 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                  <Folder className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Case File</p>
                  <p className="font-mono text-sm font-medium">{caseData.case_number}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Scale className="w-3 h-3" /> Status
                  </p>
                  <Badge variant="outline" className={cn("text-xs", status.className)}>
                    {status.label}
                  </Badge>
                </div>

                {caseData.filing_date && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Filing Date
                    </p>
                    <p className="text-sm font-medium">
                      {new Date(caseData.filing_date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </p>
                  </div>
                )}

                {caseData.updated_at && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Last Updated
                    </p>
                    <p className="text-sm font-medium">
                      {new Date(caseData.updated_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Evidence Stats Card */}
            <div className="glass-card p-5 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Evidence Summary
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-secondary/30 text-center">
                  <p className="text-2xl font-bold">{evidence.length}</p>
                  <p className="text-xs text-muted-foreground">Total Files</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/10 text-center">
                  <p className="text-2xl font-bold text-emerald-400">{approvedEvidence.length}</p>
                  <p className="text-xs text-muted-foreground">Sealed</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-500/10 text-center">
                  <p className="text-2xl font-bold text-amber-400">{pendingEvidence.length}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10 text-center">
                  <p className="text-2xl font-bold text-primary">{authorizedPersons.length}</p>
                  <p className="text-xs text-muted-foreground">Parties</p>
                </div>
              </div>
            </div>

            {/* Authorized Personnel */}
            <AuthorizedPersonnel personnel={authorizedPersons} />
          </motion.div>

          {/* Right Column: Dual-Block Evidence System */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-9"
          >
            <Tabs defaultValue="vault" className="space-y-6">
              <TabsList>
                <TabsTrigger value="vault" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Evidence Vault
                </TabsTrigger>
                {canUpload && (
                  <TabsTrigger value="upload" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Upload Workspace
                  </TabsTrigger>
                )}
                <TabsTrigger value="personnel" className="flex items-center gap-2 lg:hidden">
                  <Users className="w-4 h-4" />
                  Personnel
                </TabsTrigger>
              </TabsList>

              {/* Evidence Vault Tab */}
              <TabsContent value="vault" className="space-y-4">
                <EvidenceVault
                  evidence={evidence.map(e => ({
                    id: e.id,
                    title: e.title,
                    file_name: e.file_name,
                    file_type: e.mime_type,
                    file_size: e.file_size,
                    file_url: e.file_url,
                    status: e.is_sealed ? 'approved' : 'pending_review',
                    uploaded_by: e.uploaded_by,
                    uploader_name: e.uploader_name,
                    created_at: e.created_at,
                    signed_at: e.sealed_at,
                    signer_name: e.signer_name,
                    signature_hash: null,
                    evidence_type: e.category,
                  }))}
                  onPreview={(ev) => {
                    const full = evidence.find(e => e.id === ev.id);
                    if (full) handlePreview(full);
                  }}
                  onPresent={(ev) => {
                    const sealedIndex = approvedEvidence.findIndex(e => e.id === ev.id);
                    if (sealedIndex >= 0) handlePresent(approvedEvidence[sealedIndex], sealedIndex);
                  }}
                  onSign={isJudge ? (ev) => {
                    const full = evidence.find(e => e.id === ev.id);
                    if (full) handleSign(full);
                  } : undefined}
                  isJudge={isJudge}
                />
              </TabsContent>

              {/* Upload Workspace Tab */}
              {canUpload && id && profile && (
                <TabsContent value="upload">
                  <UploadWorkspace
                    caseId={id}
                    userId={profile.id}
                    onUploadComplete={fetchData}
                  />
                </TabsContent>
              )}

              {/* Mobile Personnel Tab */}
              <TabsContent value="personnel" className="lg:hidden">
                <AuthorizedPersonnel personnel={authorizedPersons} />
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>

      {/* Modals */}
      {selectedEvidence && (
        <>
          <SignatureModal
            open={signModalOpen}
            onOpenChange={setSignModalOpen}
            evidence={selectedEvidence}
            onSign={handleSignComplete}
          />
          <EvidencePreviewModal
            open={previewModalOpen}
            onOpenChange={setPreviewModalOpen}
            evidence={selectedEvidence}
          />
        </>
      )}

      {/* Presentation Mode */}
      <PresentationMode
        isOpen={presentationOpen}
        onClose={() => setPresentationOpen(false)}
        evidence={presentableEvidence}
        initialIndex={presentationIndex}
        caseNumber={caseData.case_number}
      />
    </div>
  );
};

export default CaseDetails;
