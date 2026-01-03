import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Shield, Lock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SignatureModal } from "@/components/cases/SignatureModal";
import { EvidencePreviewModal } from "@/components/cases/EvidencePreviewModal";
import { UploadWorkspace } from "@/components/cases/UploadWorkspace";
import { PresentationMode } from "@/components/cases/PresentationMode";
import { JudgeControlPanel } from "@/components/cases/JudgeControlPanel";
import { JudicialNotepad } from "@/components/cases/JudicialNotepad";
import { PermissionBanner } from "@/components/cases/PermissionBanner";
import { DocketSidebar } from "@/components/cases/DocketSidebar";
import { JudgeSessionCaseManager } from "@/components/dashboard/JudgeSessionCaseManager";
import { useCourtSession } from "@/hooks/useCourtSession";
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

// Get file icon based on MIME type
const getFileType = (mimeType: string | null) => {
  if (!mimeType) return "document";
  if (mimeType.includes("image")) return "image";
  if (mimeType.includes("video")) return "video";
  if (mimeType.includes("audio")) return "audio";
  if (mimeType.includes("pdf")) return "pdf";
  return "document";
};

const CaseDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();

  // Court session management
  const courtSession = useCourtSession(id || "");
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
        .from("cases")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (caseError) {
        console.error("Error fetching case:", caseError);
        toast.error("Failed to load case");
        return;
      }

      if (!caseResult) {
        toast.error("Case not found");
        return;
      }

      setCaseData(caseResult);

      // Fetch evidence for this case
      const { data: evidenceResult, error: evidenceError } = await supabase
        .from("evidence")
        .select("*")
        .eq("case_id", id)
        .order("created_at", { ascending: false });

      if (evidenceError) {
        console.error("Error fetching evidence:", evidenceError);
      } else {
        // Fetch user names for evidence uploaders and sealers
        const userIds = [
          ...new Set(
            (evidenceResult || []).flatMap((e) =>
              [e.uploaded_by, e.sealed_by].filter(Boolean) as string[]
            )
          ),
        ];

        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);

        const profileMap = new Map(
          profiles?.map((p) => [p.id, p.full_name]) || []
        );

        setEvidence(
          (evidenceResult || []).map((e) => ({
            ...e,
            uploader_name: profileMap.get(e.uploaded_by) || "Unknown",
            signer_name: e.sealed_by
              ? profileMap.get(e.sealed_by) || "Unknown"
              : undefined,
          }))
        );
      }

      // Build authorized personnel from case roles
      const plaintiffParsed = parsePartyId(caseResult.plaintiff_id);
      const defendantParsed = parsePartyId(caseResult.defendant_id);

      const profileIdsToFetch = [
        caseResult.judge_id,
        caseResult.clerk_id,
        !plaintiffParsed.isManual ? plaintiffParsed.value : null,
        !defendantParsed.isManual ? defendantParsed.value : null,
      ].filter((id): id is string => id !== null);

      const { data: roleProfiles } = await supabase
        .from("profiles")
        .select("id, full_name, role_category")
        .in("id", profileIdsToFetch);

      if (
        roleProfiles ||
        plaintiffParsed.isManual ||
        defendantParsed.isManual
      ) {
        const personnel: AuthorizedPerson[] = [];

        const findProfile = (userId: string) =>
          roleProfiles?.find((p) => p.id === userId);

        const judgeProfile = findProfile(caseResult.judge_id);
        if (judgeProfile) {
          personnel.push({
            id: judgeProfile.id,
            name: judgeProfile.full_name,
            role: "Judge",
            department: "Judiciary",
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
              role: "Clerk",
              department: "Registry",
              govId: clerkProfile.id,
              addedAt: caseResult.created_at || new Date().toISOString(),
            });
          }
        }

        if (plaintiffParsed.isManual) {
          personnel.push({
            id: `plaintiff-manual`,
            name: plaintiffParsed.value,
            role: "Plaintiff",
            department: "Party",
            govId: "Manual Entry",
            addedAt: caseResult.created_at || new Date().toISOString(),
          });
        } else {
          const plaintiffProfile = findProfile(plaintiffParsed.value);
          if (plaintiffProfile) {
            personnel.push({
              id: plaintiffProfile.id,
              name: plaintiffProfile.full_name,
              role: "Plaintiff",
              department: "Party",
              govId: plaintiffProfile.id,
              addedAt: caseResult.created_at || new Date().toISOString(),
            });
          }
        }

        if (defendantParsed.isManual) {
          personnel.push({
            id: `defendant-manual`,
            name: defendantParsed.value,
            role: "Defendant",
            department: "Party",
            govId: "Manual Entry",
            addedAt: caseResult.created_at || new Date().toISOString(),
          });
        } else {
          const defendantProfile = findProfile(defendantParsed.value);
          if (defendantProfile) {
            personnel.push({
              id: defendantProfile.id,
              name: defendantProfile.full_name,
              role: "Defendant",
              department: "Party",
              govId: defendantProfile.id,
              addedAt: caseResult.created_at || new Date().toISOString(),
            });
          }
        }

        setAuthorizedPersons(personnel);
      }
    } catch (error) {
      console.error("Error loading case:", error);
      toast.error("Failed to load case data");
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
      caseId: id || "",
      fileName: ev.title,
      fileType: ev.mime_type || "application/octet-stream",
      fileSize: ev.file_size || 0,
      fileUrl: ev.file_url || undefined,
      type: "document",
      status: "pending",
      uploadedBy: ev.uploader_name || "Unknown",
      uploadedAt: ev.created_at || new Date().toISOString(),
    };
    setSelectedEvidence(transformed);
    setSignModalOpen(true);
  };

  const handleSignComplete = async (ev: LocalEvidence, hash: string) => {
    if (!profile?.id) {
      toast.error("You must be logged in to seal evidence");
      return;
    }

    const { error } = await supabase
      .from("evidence")
      .update({
        is_sealed: true,
        sealed_by: profile.id,
        sealed_at: new Date().toISOString(),
      })
      .eq("id", ev.id);

    if (error) {
      console.error("Error sealing evidence:", error);
      toast.error("Failed to seal evidence");
      return;
    }

    // Log the seal action to chain_of_custody
    await supabase.from("chain_of_custody").insert({
      evidence_id: ev.id,
      action: "SEALED",
      performed_by: profile.id,
      details: { signature_hash: hash },
    });

    await fetchData();
    toast.success("Evidence sealed with judicial signature");
  };

  const handlePreview = (ev: EvidenceWithNames) => {
    const transformed: LocalEvidence = {
      id: ev.id,
      caseId: id || "",
      fileName: ev.title,
      fileType: ev.mime_type || "application/octet-stream",
      fileSize: ev.file_size || 0,
      fileUrl: ev.file_url || undefined,
      type: "document",
      status: ev.is_sealed ? "immutable" : "pending",
      uploadedBy: ev.uploader_name || "Unknown",
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

  const canUpload =
    profile?.role_category === "judiciary" ||
    profile?.role_category === "legal_practitioner";
  const isJudge = profile?.role_category === "judiciary";

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

  const approvedEvidence = evidence.filter((e) => e.is_sealed === true);
  const pendingEvidence = evidence.filter((e) => !e.is_sealed);

  // Transform for presentation mode
  const presentableEvidence: LocalEvidence[] = approvedEvidence.map((e) => ({
    id: e.id,
    caseId: id || "",
    fileName: e.title,
    fileType: e.mime_type || "application/octet-stream",
    fileSize: e.file_size || 0,
    fileUrl: e.file_url || undefined,
    type: "document",
    status: "immutable",
    uploadedBy: e.uploader_name || "Unknown",
    uploadedAt: e.created_at || new Date().toISOString(),
    signedBy: e.signer_name,
    signedAt: e.sealed_at || undefined,
  }));

  // Map parties for sidebar
  const sidebarParties = authorizedPersons.map((p) => ({
    id: p.id,
    name: p.name,
    role: p.role,
    isOnline: false, // Could be extended with presence system
  }));

  return (
    <div className="min-h-screen bg-[hsl(0,0%,4%)] flex flex-col">
      {/* Simple Header */}
      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-8 w-8"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <code className="text-sm font-mono text-muted-foreground">
              {caseData.case_number}
            </code>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isJudge && !courtSession.isSessionActive && (
            <Button
              onClick={courtSession.startSession}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Court Session
            </Button>
          )}
          {isJudge && courtSession.isSessionActive && (
            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Session Active
            </Badge>
          )}
        </div>
      </header>

      {/* Main Layout: 75% / 25% */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Workspace (Left - 75%) */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Judge Controls (if active session) */}
          {isJudge && courtSession.isSessionActive && (
            <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <JudgeControlPanel
                isSessionActive={courtSession.isSessionActive}
                session={courtSession.activeSession}
                permissionRequests={courtSession.permissionRequests}
                onStartSession={courtSession.startSession}
                onEndSession={courtSession.endSession}
                onRespondPermission={courtSession.respondToPermission}
              />
              {courtSession.activeSession && (
                <JudicialNotepad
                  session={courtSession.activeSession}
                  onSaveNotes={courtSession.updateNotes}
                />
              )}
            </div>
          )}

          {/* Evidence Vault - Hero Section */}
          <Tabs defaultValue="vault" className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList className="bg-card border border-border">
                <TabsTrigger value="vault" className="data-[state=active]:bg-secondary">
                  <Shield className="w-4 h-4 mr-2" />
                  Evidence Vault
                </TabsTrigger>
                {canUpload && (
                  <TabsTrigger value="upload" className="data-[state=active]:bg-secondary">
                    Upload
                  </TabsTrigger>
                )}
                {isJudge && (
                  <TabsTrigger value="session" className="data-[state=active]:bg-secondary">
                    <FileText className="w-4 h-4 mr-2" />
                    Session Manager
                  </TabsTrigger>
                )}
              </TabsList>

              {presentableEvidence.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPresentationIndex(0);
                    setPresentationOpen(true);
                  }}
                  className="border-border"
                >
                  Present Case
                </Button>
              )}
            </div>

            <TabsContent value="vault" className="mt-0">
              {evidence.length === 0 ? (
                <div className="border border-dashed border-border rounded-lg p-12 text-center">
                  <Shield className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">
                    No evidence in the vault yet
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Sealed Evidence */}
                  {approvedEvidence.length > 0 && (
                    <section>
                      <div className="flex items-center gap-2 mb-4">
                        <Lock className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-sm font-medium">
                          Sealed Evidence
                        </h3>
                        <Badge
                          variant="outline"
                          className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        >
                          {approvedEvidence.length}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {approvedEvidence.map((ev, index) => (
                          <EvidenceCard
                            key={ev.id}
                            evidence={ev}
                            isSealed
                            onPreview={() => handlePreview(ev)}
                            onPresent={() => handlePresent(ev, index)}
                          />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Pending Evidence */}
                  {pendingEvidence.length > 0 && (
                    <section>
                      <div className="flex items-center gap-2 mb-4">
                        <Shield className="w-4 h-4 text-amber-400" />
                        <h3 className="text-sm font-medium">
                          Pending Review
                        </h3>
                        <Badge
                          variant="outline"
                          className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30"
                        >
                          {pendingEvidence.length}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {pendingEvidence.map((ev) => (
                          <EvidenceCard
                            key={ev.id}
                            evidence={ev}
                            isSealed={false}
                            onPreview={() => handlePreview(ev)}
                            onSeal={isJudge ? () => handleSign(ev) : undefined}
                          />
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}
            </TabsContent>

            {canUpload && id && profile && (
              <TabsContent value="upload" className="mt-0">
                {!isJudge && (
                  <PermissionBanner
                    isSessionActive={courtSession.isSessionActive}
                    myPermission={courtSession.myPermission}
                    isJudge={isJudge}
                    onRequestPermission={courtSession.requestPermission}
                  />
                )}
                {(courtSession.canUpload || isJudge) && (
                  <UploadWorkspace
                    caseId={id}
                    userId={profile.id}
                    onUploadComplete={fetchData}
                  />
                )}
              </TabsContent>
            )}

            {isJudge && caseData && profile && (
              <TabsContent value="session" className="mt-0">
                <JudgeSessionCaseManager
                  caseId={caseData.id}
                  caseName={caseData.title}
                  caseNumber={caseData.case_number}
                  currentJudgeId={profile.id}
                  onCaseTransferred={() => {
                    toast.success("Case transferred. Redirecting...");
                    setTimeout(() => {
                      navigate("/dashboard");
                    }, 2000);
                  }}
                />
              </TabsContent>
            )}
          </Tabs>
        </main>

        {/* Docket Sidebar (Right - 25%) */}
        <aside className="w-80 shrink-0 hidden lg:block overflow-y-auto">
          <DocketSidebar
            caseId={id || ""}
            caseNumber={caseData.case_number}
            filingDate={caseData.filing_date}
            status={caseData.status}
            parties={sidebarParties}
          />
        </aside>
      </div>

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

// Evidence Card Component - Clean, professional style
interface EvidenceCardProps {
  evidence: EvidenceWithNames;
  isSealed: boolean;
  onPreview: () => void;
  onPresent?: () => void;
  onSeal?: () => void;
}

const EvidenceCard = ({
  evidence,
  isSealed,
  onPreview,
  onPresent,
  onSeal,
}: EvidenceCardProps) => {
  const isImage = evidence.mime_type?.includes("image");
  const isVideo = evidence.mime_type?.includes("video");

  return (
    <div
      className={cn(
        "group bg-card border border-border rounded-lg overflow-hidden transition-all hover:border-muted-foreground/30",
        isSealed && "ring-1 ring-emerald-500/20"
      )}
    >
      {/* Preview Area */}
      <div
        onClick={onPreview}
        className={cn(
          "aspect-video relative cursor-pointer bg-secondary/50",
          !isSealed && "opacity-80 group-hover:opacity-100"
        )}
      >
        {isImage && evidence.file_url ? (
          <img
            src={evidence.file_url}
            alt={evidence.title}
            className="w-full h-full object-cover"
          />
        ) : isVideo && evidence.file_url ? (
          <video
            src={evidence.file_url}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
              <span className="text-xs font-mono text-muted-foreground uppercase">
                {getFileType(evidence.mime_type).slice(0, 3)}
              </span>
            </div>
          </div>
        )}

        {/* Seal indicator */}
        {isSealed && (
          <div className="absolute top-2 right-2">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Lock className="w-3 h-3 text-emerald-400" />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h4 className="text-sm font-medium truncate mb-1" title={evidence.title}>
          {evidence.title}
        </h4>
        <p className="text-xs text-muted-foreground mb-3">
          {evidence.uploader_name}
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          {isSealed && onPresent && (
            <Button
              variant="outline"
              size="sm"
              onClick={onPresent}
              className="flex-1 text-xs h-7 border-border"
            >
              Present
            </Button>
          )}
          {!isSealed && onSeal && (
            <Button
              size="sm"
              onClick={onSeal}
              className="flex-1 text-xs h-7 bg-emerald-600 hover:bg-emerald-700"
            >
              Seal
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onPreview}
            className="text-xs h-7"
          >
            View
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CaseDetails;
