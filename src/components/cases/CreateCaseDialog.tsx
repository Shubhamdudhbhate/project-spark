import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Scale, RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const caseFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  judgeId: z.string().min(1, "Judge is required"),
  clerkId: z.string().min(1, "Clerk is required"),
  plaintiffId: z.string().optional(),
  defendantId: z.string().optional(),
  plaintiffName: z.string().optional(),
  defendantName: z.string().optional(),
}).refine((data) => data.plaintiffId || data.plaintiffName, {
  message: "Plaintiff is required (select or enter manually)",
  path: ["plaintiffId"],
}).refine((data) => data.defendantId || data.defendantName, {
  message: "Defendant is required (select or enter manually)",
  path: ["defendantId"],
});

type CaseFormValues = z.infer<typeof caseFormSchema>;

interface CreateCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionId: string;
  onCaseCreated: () => void;
}

type Profile = {
  id: string;
  full_name: string;
  role_category: string | null;
};

const generateCaseNumber = (sectionId: string) => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `CASE/${year}/${sectionId.slice(0, 4).toUpperCase()}/${random}`;
};

export const CreateCaseDialog = ({
  open,
  onOpenChange,
  sectionId,
  onCaseCreated,
}: CreateCaseDialogProps) => {
  
  const [isLoading, setIsLoading] = useState(false);
  const [caseNumber, setCaseNumber] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [plaintiffMode, setPlaintiffMode] = useState<"select" | "manual">("select");
  const [defendantMode, setDefendantMode] = useState<"select" | "manual">("select");

  const form = useForm<CaseFormValues>({
    resolver: zodResolver(caseFormSchema),
    defaultValues: {
      title: "",
      description: "",
      judgeId: "",
      clerkId: "",
      plaintiffId: "",
      defendantId: "",
      plaintiffName: "",
      defendantName: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (open) {
      setCaseNumber(generateCaseNumber(sectionId));
      fetchProfiles();
    }
  }, [open, sectionId]);

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role_category")
      .order("full_name");

    if (error) {
      console.error("Error fetching profiles:", error);
      return;
    }

    setProfiles(data || []);
  };

  const regenerateCaseNumber = () => {
    setCaseNumber(generateCaseNumber(sectionId));
  };

  const judiciaryProfiles = profiles.filter((p) => p.role_category === "judiciary");
  const legalProfiles = profiles.filter((p) => p.role_category === "legal_practitioner");
  const publicProfiles = profiles.filter((p) => p.role_category === "public");

  const createProfileIfManual = async (name: string, roleCategory: string): Promise<string> => {
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: crypto.randomUUID(),
        full_name: name.trim(),
        role_category: roleCategory,
      })
      .select("id")
      .single();

    if (error) throw error;
    return data.id;
  };

  const onSubmit = async (data: CaseFormValues) => {
    try {
      setIsLoading(true);

      // Get the section's case_block_id (we'll use section_id as case_block_id for now)
      const { data: sectionData, error: sectionError } = await supabase
        .from("sections")
        .select("id")
        .eq("id", sectionId)
        .maybeSingle();

      if (sectionError || !sectionData) {
        throw new Error("Section not found");
      }

      // Handle plaintiff - create profile if manual
      let plaintiffId = data.plaintiffId;
      if (plaintiffMode === "manual" && data.plaintiffName) {
        plaintiffId = await createProfileIfManual(data.plaintiffName, "public");
      }

      // Handle defendant - create profile if manual
      let defendantId = data.defendantId;
      if (defendantMode === "manual" && data.defendantName) {
        defendantId = await createProfileIfManual(data.defendantName, "public");
      }

      if (!plaintiffId || !defendantId) {
        throw new Error("Plaintiff and Defendant are required");
      }

      const { error } = await supabase.from("cases").insert({
        case_number: caseNumber,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        status: "pending",
        filing_date: new Date().toISOString(),
        section_id: sectionId,
        case_block_id: sectionId,
        judge_id: data.judgeId,
        clerk_id: data.clerkId,
        plaintiff_id: plaintiffId,
        defendant_id: defendantId,
      });

      if (error) {
        throw error;
      }

      toast.success(`Case ${caseNumber} created successfully`);
      form.reset();
      onOpenChange(false);
      onCaseCreated();
    } catch (error) {
      console.error("Error creating case:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create case"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-white/10 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            Create New Case
          </DialogTitle>
          <DialogDescription>
            Register a new case in this section. Link all required personnel.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Case Number */}
          <div className="space-y-2">
            <Label>Case Number (Auto-generated)</Label>
            <div className="flex gap-2">
              <Input
                value={caseNumber}
                readOnly
                className="bg-secondary/50 border-white/10 font-mono"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={regenerateCaseNumber}
                className="shrink-0"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Case Title *</Label>
            <Input
              id="title"
              placeholder="e.g., State vs. Sharma"
              className="bg-secondary/30 border-white/10"
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Brief case description..."
              className="min-h-[80px] bg-secondary/30 border-white/10"
              {...form.register("description")}
            />
          </div>

          {/* Personnel Section */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users className="w-4 h-4" />
              Link Personnel
            </div>

            {/* Judge Selection */}
            <div className="space-y-2">
              <Label>Presiding Judge *</Label>
              <Select
                onValueChange={(v) => form.setValue("judgeId", v, { shouldValidate: true })}
                value={form.watch("judgeId")}
              >
                <SelectTrigger className="bg-secondary/30 border-white/10">
                  <SelectValue placeholder="Select judge" />
                </SelectTrigger>
                <SelectContent>
                  {judiciaryProfiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.judgeId && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.judgeId.message}
                </p>
              )}
            </div>

            {/* Clerk Selection */}
            <div className="space-y-2">
              <Label>Court Clerk *</Label>
              <Select
                onValueChange={(v) => form.setValue("clerkId", v, { shouldValidate: true })}
                value={form.watch("clerkId")}
              >
                <SelectTrigger className="bg-secondary/30 border-white/10">
                  <SelectValue placeholder="Select clerk" />
                </SelectTrigger>
                <SelectContent>
                  {legalProfiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.clerkId && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.clerkId.message}
                </p>
              )}
            </div>

            {/* Plaintiff Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Plaintiff *</Label>
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setPlaintiffMode("select");
                      form.setValue("plaintiffName", "", { shouldValidate: true });
                    }}
                    className={`px-2 py-1 rounded ${plaintiffMode === "select" ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground"}`}
                  >
                    Select
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPlaintiffMode("manual");
                      form.setValue("plaintiffId", "", { shouldValidate: true });
                    }}
                    className={`px-2 py-1 rounded ${plaintiffMode === "manual" ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground"}`}
                  >
                    Manual
                  </button>
                </div>
              </div>
              {plaintiffMode === "select" ? (
                <Select
                  onValueChange={(v) => form.setValue("plaintiffId", v, { shouldValidate: true })}
                  value={form.watch("plaintiffId")}
                >
                  <SelectTrigger className="bg-secondary/30 border-white/10">
                    <SelectValue placeholder="Select plaintiff" />
                  </SelectTrigger>
                  <SelectContent>
                    {publicProfiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="Enter plaintiff name"
                  className="bg-secondary/30 border-white/10"
                  {...form.register("plaintiffName")}
                />
              )}
              {form.formState.errors.plaintiffId && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.plaintiffId.message}
                </p>
              )}
            </div>

            {/* Defendant Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Defendant *</Label>
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setDefendantMode("select");
                      form.setValue("defendantName", "", { shouldValidate: true });
                    }}
                    className={`px-2 py-1 rounded ${defendantMode === "select" ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground"}`}
                  >
                    Select
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDefendantMode("manual");
                      form.setValue("defendantId", "", { shouldValidate: true });
                    }}
                    className={`px-2 py-1 rounded ${defendantMode === "manual" ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground"}`}
                  >
                    Manual
                  </button>
                </div>
              </div>
              {defendantMode === "select" ? (
                <Select
                  onValueChange={(v) => form.setValue("defendantId", v, { shouldValidate: true })}
                  value={form.watch("defendantId")}
                >
                  <SelectTrigger className="bg-secondary/30 border-white/10">
                    <SelectValue placeholder="Select defendant" />
                  </SelectTrigger>
                  <SelectContent>
                    {publicProfiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.full_name}
                    </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="Enter defendant name"
                  className="bg-secondary/30 border-white/10"
                  {...form.register("defendantName")}
                />
              )}
              {form.formState.errors.defendantId && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.defendantId.message}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !form.formState.isValid}
              className="glow-button"
            >
              {isLoading ? "Creating..." : "Create Case"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
