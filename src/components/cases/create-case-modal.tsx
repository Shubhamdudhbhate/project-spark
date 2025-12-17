// src/components/cases/create-case-modal.tsx

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Plus, Scale, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  caseFormSchema, 
  CaseFormValues, 
  INDIAN_COURTS, 
  CASE_CATEGORIES,
  generateCaseNumber 
} from "@/lib/schemas/case"
import { createCase } from "@/services/caseService"

export function CreateCaseModal() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [caseNumber, setCaseNumber] = useState("")

  const form = useForm<CaseFormValues>({
    resolver: zodResolver(caseFormSchema),
    defaultValues: {
      title: "",
      courtCode: "",
      presidingJudge: "",
      category: "",
      status: "open",
      description: "",
    },
    mode: "onChange"
  })

  const selectedCourtCode = form.watch("courtCode")

  // Generate case number when court changes
  useEffect(() => {
    if (selectedCourtCode) {
      setCaseNumber(generateCaseNumber(selectedCourtCode))
    }
  }, [selectedCourtCode])

  const regenerateCaseNumber = () => {
    if (selectedCourtCode) {
      setCaseNumber(generateCaseNumber(selectedCourtCode))
    }
  }

  const getCourtName = (code: string) => {
    return INDIAN_COURTS.find(c => c.code === code)?.name || ""
  }

  const onSubmit = async (data: CaseFormValues) => {
    try {
      setIsLoading(true)
      
      const caseData = {
        title: data.title.trim(),
        caseNumber: caseNumber,
        courtName: getCourtName(data.courtCode),
        presidingJudge: data.presidingJudge.trim(),
        description: data.description?.trim() || '',
      }

      const newCase = await createCase(caseData)
      
      toast({
        title: "Case Created Successfully!",
        description: `Case ${newCase.caseNumber} has been registered.`,
      })
      
      form.reset()
      setCaseNumber("")
      setOpen(false)
      
      // Navigate to the new case
      navigate(`/cases/${newCase.id}`)
      
    } catch (error) {
      console.error("Error creating case:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create case. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="flex items-center gap-2 glow-button"
        >
          <Plus className="h-4 w-4" />
          <span>New Case</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] glass-card border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            Register New Case
          </DialogTitle>
          <DialogDescription>
            Fill in the case details. Case number will be auto-generated based on court selection.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Case Title */}
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

          {/* Court Selection & Case Number */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Select Court *</Label>
              <Select
                onValueChange={(value) => form.setValue("courtCode", value, { shouldValidate: true })}
                value={form.watch("courtCode")}
              >
                <SelectTrigger className="bg-secondary/30 border-white/10">
                  <SelectValue placeholder="Select court" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {INDIAN_COURTS.map((court) => (
                    <SelectItem key={court.code} value={court.code}>
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-xs text-primary">{court.code}</span>
                        <span>{court.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.courtCode && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.courtCode.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Case Number (Auto-generated)</Label>
              <div className="flex gap-2">
                <Input
                  value={caseNumber}
                  readOnly
                  placeholder="Select court first"
                  className="bg-secondary/50 border-white/10 font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={regenerateCaseNumber}
                  disabled={!selectedCourtCode}
                  className="shrink-0"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Case Category *</Label>
              <Select
                onValueChange={(value) => form.setValue("category", value, { shouldValidate: true })}
                value={form.watch("category")}
              >
                <SelectTrigger className="bg-secondary/30 border-white/10">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CASE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.category && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.category.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                onValueChange={(value) => form.setValue("status", value as "open" | "pending" | "closed")}
                value={form.watch("status")}
              >
                <SelectTrigger className="bg-secondary/30 border-white/10">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Presiding Judge */}
          <div className="space-y-2">
            <Label>Presiding Judge *</Label>
            <Input
              placeholder="e.g., Hon. Justice R.K. Gauba"
              className="bg-secondary/30 border-white/10"
              {...form.register("presidingJudge")}
            />
            {form.formState.errors.presidingJudge && (
              <p className="text-sm text-destructive">
                {form.formState.errors.presidingJudge.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Case Description</Label>
            <Textarea
              placeholder="Brief description of the case..."
              className="min-h-[100px] bg-secondary/30 border-white/10"
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !form.formState.isValid || !caseNumber}
              className="glow-button min-w-[140px]"
            >
              {isLoading ? "Creating..." : "Create Case"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}