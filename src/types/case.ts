export type CaseStatus = "open" | "closed" | "pending";
export type EvidenceStatus = "draft" | "pending" | "signed" | "immutable";
export type EvidenceType = "forensic" | "cctv" | "witness" | "document" | "audio" | "other";

export interface CaseFile {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  courtName: string;
  presidingJudge: string;
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
  evidenceCount: number;
}

export interface Evidence {
  id: string;
  caseId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl?: string;
  thumbnailUrl?: string;
  type: EvidenceType;
  status: EvidenceStatus;
  uploadedBy: string;
  uploadedAt: string;
  hash?: string;
  signedBy?: string;
  signedAt?: string;
  signature?: string;
  hearingSessionId?: string;
}

export interface CustodyEvent {
  id: string;
  caseId: string;
  action: string;
  actor: string;
  timestamp: string;
  details: string;
  txHash?: string;
}

export interface AuthorizedPerson {
  id: string;
  name: string;
  role: string;
  department: string;
  govId: string;
  addedAt: string;
}
