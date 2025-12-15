"use client"

import { useState, useCallback } from "react"
import { FileText, FileVideo, FileAudio, Image as ImageIcon, Upload, X, File } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type EvidenceType = "document" | "photo" | "video" | "audio"

interface EvidenceItem {
  id: string
  name: string
  type: EvidenceType
  size: string
  uploadedAt: string
  status: "pending" | "verified" | "error"
  hash?: string
  previewUrl?: string
  metadata: {
    collectedBy: string
    collectionDate: string
    location: string
    notes: string
  }
}

// Mock data for demonstration
const mockEvidence: EvidenceItem[] = [
  {
    id: "1",
    name: "FIR_Report.pdf",
    type: "document",
    size: "2.4 MB",
    uploadedAt: "2025-01-05T14:30:00Z",
    status: "verified",
    hash: "0x1a2b3c4d5e6f7g8h9i0j",
    metadata: {
      collectedBy: "Insp. Vikram Joshi",
      collectionDate: "2025-01-05",
      location: "Mumbai Police Station",
      notes: "Original FIR filed by the complainant"
    }
  },
  {
    id: "2",
    name: "Crime_Scene_1.jpg",
    type: "photo",
    size: "3.2 MB",
    uploadedAt: "2025-01-06T10:15:00Z",
    status: "verified",
    hash: "0x9i8h7g6f5e4d3c2b1a0j",
    previewUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=60",
    metadata: {
      collectedBy: "Forensic Team",
      collectionDate: "2025-01-06",
      location: "123 Main St, Mumbai",
      notes: "Entrance point of the crime scene"
    }
  },
  {
    id: "3",
    name: "Witness_Statement.mp3",
    type: "audio",
    size: "5.7 MB",
    uploadedAt: "2025-01-07T16:45:00Z",
    status: "pending",
    metadata: {
      collectedBy: "SI Ramesh Kumar",
      collectionDate: "2025-01-07",
      location: "Witness Residence",
      notes: "Eyewitness account of the incident"
    }
  }
]

export function EvidenceGrid() {
  const [evidence, setEvidence] = useState<EvidenceItem[]>(mockEvidence)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [evidenceType, setEvidenceType] = useState<EvidenceType | "">("")
  const [metadata, setMetadata] = useState({
    collectedBy: "",
    collectionDate: new Date().toISOString().split('T')[0],
    location: "",
    notes: ""
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0])
      // Auto-detect file type if not already set
      if (!evidenceType) {
        const file = acceptedFiles[0]
        if (file.type.startsWith('image/')) {
          setEvidenceType('photo')
        } else if (file.type.startsWith('video/')) {
          setEvidenceType('video')
        } else if (file.type.startsWith('audio/')) {
          setEvidenceType('audio')
        } else {
          setEvidenceType('document')
        }
      }
    }
  }, [evidenceType])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif'],
      'video/*': ['.mp4', '.webm', '.mov'],
      'audio/*': ['.mp3', '.wav', '.ogg']
    },
    maxFiles: 1,
    disabled: isUploading
  })

  const handleMetadataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setMetadata(prev => ({ ...prev, [name]: value }))
  }

  const handleUpload = async () => {
    if (!selectedFile || !evidenceType) return

    setIsUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    let interval: NodeJS.Timeout | null = null;
    interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          if (interval) clearInterval(interval)
          return prev
        }
        return prev + 10
      })
    }, 200)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Create new evidence item
      const newEvidence: EvidenceItem = {
        id: `evidence-${Date.now()}`,
        name: selectedFile.name,
        type: evidenceType as EvidenceType,
        size: `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`,
        uploadedAt: new Date().toISOString(),
        status: "pending",
        metadata: {
          ...metadata,
          collectedBy: metadata.collectedBy || "Current User",
          collectionDate: metadata.collectionDate || new Date().toISOString().split('T')[0]
        }
      }

      setEvidence(prev => [newEvidence, ...prev])
      setUploadProgress(100)
      
      toast({
        title: "Evidence uploaded",
        description: "Your evidence has been uploaded and is being processed.",
      })

      // Reset form
      setSelectedFile(null)
      setEvidenceType("")
      setMetadata({
        collectedBy: "",
        collectionDate: new Date().toISOString().split('T')[0],
        location: "",
        notes: ""
      })
      setIsUploadModalOpen(false)
    } catch (error) {
      console.error("Error uploading evidence:", error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your evidence. Please try again.",
        variant: "destructive"
      })
    } finally {
      if (interval) clearInterval(interval)
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const getFileIcon = (type: EvidenceType) => {
    switch (type) {
      case "document":
        return <FileText className="h-12 w-12 text-blue-500" />
      case "photo":
        return <ImageIcon className="h-12 w-12 text-green-500" />
      case "video":
        return <FileVideo className="h-12 w-12 text-purple-500" />
      case "audio":
        return <FileAudio className="h-12 w-12 text-orange-500" />
      default:
        return <File className="h-12 w-12 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800">
            Verified
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-700 dark:text-yellow-400">
            Pending
          </Badge>
        )
      case "error":
        return <Badge variant="destructive">Error</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Evidence Vault</h2>
        <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Add Evidence
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Upload New Evidence</DialogTitle>
              <DialogDescription>
                Add new evidence to the case. All uploaded files will be hashed and stored securely.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Evidence Type</Label>
                <Select 
                  value={evidenceType} 
                  onValueChange={(value) => setEvidenceType(value as EvidenceType)}
                  disabled={!!selectedFile}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select evidence type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="document">Document (PDF, DOCX)</SelectItem>
                    <SelectItem value="photo">Photo (JPG, PNG)</SelectItem>
                    <SelectItem value="video">Video (MP4, MOV)</SelectItem>
                    <SelectItem value="audio">Audio (MP3, WAV)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!selectedFile ? (
                <div 
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10" : "border-gray-300 dark:border-gray-700"
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {isDragActive
                        ? "Drop the file here"
                        : "Drag & drop a file here, or click to select"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supported formats: PDF, DOCX, JPG, PNG, MP4, MP3
                    </p>
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-md bg-muted">
                        {getFileIcon(evidenceType as EvidenceType)}
                      </div>
                      <div>
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedFile(null)}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {isUploading && (
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="collectedBy">Collected By</Label>
                    <Input
                      id="collectedBy"
                      name="collectedBy"
                      value={metadata.collectedBy}
                      onChange={handleMetadataChange}
                      placeholder="Officer name"
                      disabled={isUploading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="collectionDate">Collection Date</Label>
                    <Input
                      id="collectionDate"
                      name="collectionDate"
                      type="date"
                      value={metadata.collectionDate}
                      onChange={handleMetadataChange}
                      disabled={isUploading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    value={metadata.location}
                    onChange={handleMetadataChange}
                    placeholder="Where was this evidence collected?"
                    disabled={isUploading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={metadata.notes}
                    onChange={handleMetadataChange}
                    placeholder="Additional details about this evidence"
                    rows={3}
                    disabled={isUploading}
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsUploadModalOpen(false)
                  setSelectedFile(null)
                }}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? "Uploading..." : "Upload Evidence"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {evidence.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-1">No evidence added yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Get started by uploading your first piece of evidence</p>
          <Button onClick={() => setIsUploadModalOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Add Evidence
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {evidence.map((item) => (
            <Card 
              key={item.id} 
              className={`overflow-hidden transition-all hover:shadow-md ${
                item.status === "verified" 
                  ? "border-green-200 dark:border-green-900" 
                  : item.status === "pending"
                  ? "border-yellow-200 dark:border-yellow-900"
                  : ""
              }`}
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(item.type)}
                    <div>
                      <CardTitle className="text-base font-medium line-clamp-1">
                        {item.name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {item.size} • {new Date(item.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {item.type === "photo" && item.previewUrl ? (
                  <div className="relative aspect-video rounded-md overflow-hidden bg-muted mb-3">
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-24 bg-muted rounded-md flex items-center justify-center mb-3">
                    {getFileIcon(item.type)}
                  </div>
                )}
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Collected by:</span>
                    <span className="font-medium">{item.metadata.collectedBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{item.metadata.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">
                      {new Date(item.metadata.collectionDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-between">
                <Button variant="outline" size="sm">
                  View Details
                </Button>
                {item.status === "verified" && item.hash && (
                  <div className="text-xs text-muted-foreground flex items-center">
                    <span className="hidden sm:inline">Hash: </span>
                    <span className="ml-1 font-mono text-xs truncate max-w-[100px] sm:max-w-[120px]">
                      {item.hash}
                    </span>
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
