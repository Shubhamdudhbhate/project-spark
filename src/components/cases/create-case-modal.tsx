// src/components/cases/create-case-modal.tsx

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Plus } from "lucide-react"
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
import { toast } from "@/components/ui/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { caseFormSchema } from "@/lib/schemas/case"
import { createCase } from "@/services/caseService"

type FormData = {
  title: string
  caseNumber: string
  courtName: string
  presidingJudge: string
  description: string
  status: 'open' | 'pending' | 'closed'
}

export function CreateCaseModal() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(caseFormSchema),
    defaultValues: {
      title: "",
      caseNumber: `NYAY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      courtName: "",
      presidingJudge: "",
      status: "open",
      description: "",
    }
  })

  const generateCaseNumber = () => {
    return `NYAY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  }

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true)
      
      const caseData = {
        title: data.title.trim(),
        caseNumber: data.caseNumber || generateCaseNumber(),
        courtName: data.courtName,
        presidingJudge: data.presidingJudge,
        description: data.description?.trim() || '',
        status: data.status as 'open' | 'pending' | 'closed',
        evidenceCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const newCase = await createCase(caseData)
      
      toast({
        title: "Success!",
        description: `Case ${newCase.caseNumber} has been created successfully.`,
      })
      
      form.reset({
        title: "",
        caseNumber: generateCaseNumber(),
        courtName: "",
        presidingJudge: "",
        status: "open",
        description: "",
      })
      
      setOpen(false)
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
          className="flex items-center gap-2"
          onClick={() => setOpen(true)}
        >
          <Plus className="h-4 w-4" />
          <span>New Case</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Case</DialogTitle>
          <DialogDescription>
            Fill out the form below to create a new case.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Case Title *</Label>
            <Input
              id="title"
              placeholder="Enter case title"
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-500">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Case Number</Label>
              <Input
                value={form.watch("caseNumber")}
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label>Status *</Label>
              <Select
                onValueChange={(value) => form.setValue("status", value as "open" | "pending" | "closed")}
                value={form.watch("status")}
              >
                <SelectTrigger>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Court Name *</Label>
              <Input
                placeholder="Enter court name"
                {...form.register("courtName")}
              />
              {form.formState.errors.courtName && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.courtName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Presiding Judge *</Label>
              <Input
                placeholder="Enter judge's name"
                {...form.register("presidingJudge")}
              />
              {form.formState.errors.presidingJudge && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.presidingJudge.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Enter case description"
              className="min-h-[100px]"
              {...form.register("description")}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
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
              disabled={isLoading || !form.formState.isValid}
              className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
            >
              {isLoading ? "Creating..." : "Create Case"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}