import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWeb3 } from "@/contexts/Web3Context";
import { uploadToIPFS, generateFileHash } from "@/services/ipfsService";
import { toast } from "sonner";

const IPFS_GATEWAY = import.meta.env.VITE_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs/";

interface UploadProgress {
  fileName: string;
  status: "hashing" | "encrypting" | "ipfs" | "blockchain" | "complete";
  progress: number;
  cid?: string;
  fileHash?: string;
  txHash?: string;
}

interface UploadResult {
  success: boolean;
  evidenceId?: string;
  cid?: string;
  fileHash?: string;
  txHash?: string;
  error?: string;
}


// Record hash on blockchain (placeholder - you'll need to implement your smart contract)
const recordOnBlockchain = async (
  _fileHash: string,
  _cid: string,
  _caseId: string
): Promise<string> => {
  // This is a placeholder - implement your smart contract interaction here
  // Example using wagmi/viem:
  // const { writeContract } = useWriteContract();
  // const txHash = await writeContract({
  //   address: CONTRACT_ADDRESS,
  //   abi: CONTRACT_ABI,
  //   functionName: 'recordEvidence',
  //   args: [fileHash, cid, caseId]
  // });
  
  // For now, return a mock hash
  return `0x${Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("")}`;
};

export const useSecureUpload = () => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { isConnected } = useWeb3();

  const uploadFile = useCallback(
    async (
      file: File,
      caseId: string,
      userId: string,
      metadata: {
        title: string;
        description?: string;
        category: string;
      }
    ): Promise<UploadResult> => {
      setIsUploading(true);

      try {
        // Step 1: Generate hash
        setUploadProgress((prev) => [
          ...prev,
          {
            fileName: file.name,
            status: "hashing",
            progress: 10,
          },
        ]);

        const fileHash = await generateFileHash(file);
        setUploadProgress((prev) =>
          prev.map((p) =>
            p.fileName === file.name
              ? { ...p, status: "encrypting", progress: 30, fileHash }
              : p
          )
        );

        // Step 2: Upload to IPFS
        const ipfsResult = await uploadToIPFS(file);
        if (!ipfsResult.success || !ipfsResult.cid) {
          throw new Error(ipfsResult.error || "Failed to upload to IPFS");
        }
        const cid = ipfsResult.cid;
        setUploadProgress((prev) =>
          prev.map((p) =>
            p.fileName === file.name
              ? { ...p, status: "ipfs", progress: 60, cid }
              : p
          )
        );

        // Step 3: Record on blockchain (if connected)
        let txHash: string | undefined;
        if (isConnected) {
          txHash = await recordOnBlockchain(fileHash, cid, caseId);
          setUploadProgress((prev) =>
            prev.map((p) =>
              p.fileName === file.name
                ? { ...p, status: "blockchain", progress: 80, txHash }
                : p
            )
          );
        }

        // Step 4: Create evidence record in Supabase
        const ipfsUrl = `${IPFS_GATEWAY}${cid}`;
        
        const { data: evidenceData, error: dbError } = await supabase
          .from("evidence")
          .insert({
            case_id: caseId,
            title: metadata.title,
            description: metadata.description || null,
            file_name: file.name,
            file_url: ipfsUrl,
            file_size: file.size,
            mime_type: file.type,
            category: metadata.category as "document" | "video" | "audio" | "image" | "other",
            uploaded_by: userId,
            is_sealed: false,
          })
          .select()
          .single();

        if (dbError) {
          throw new Error(`Database error: ${dbError.message}`);
        }

        // Step 5: Create chain of custody entry
        await supabase.from("chain_of_custody").insert({
          evidence_id: evidenceData.id,
          action: "UPLOADED",
          performed_by: userId,
          details: {
            file_name: file.name,
            file_size: file.size,
            file_hash: fileHash,
            ipfs_cid: cid,
            blockchain_tx: txHash,
          },
        });

        setUploadProgress((prev) =>
          prev.map((p) =>
            p.fileName === file.name
              ? { ...p, status: "complete", progress: 100 }
              : p
          )
        );

        // Remove from progress after 2 seconds
        setTimeout(() => {
          setUploadProgress((prev) =>
            prev.filter((p) => p.fileName !== file.name)
          );
        }, 2000);

        toast.success(`Evidence "${metadata.title}" uploaded successfully`);

        return {
          success: true,
          evidenceId: evidenceData.id,
          cid,
          fileHash,
          txHash,
        };
      } catch (error: any) {
        console.error("Upload error:", error);
        toast.error(error?.message || "Failed to upload evidence");
        
        setUploadProgress((prev) =>
          prev.filter((p) => p.fileName !== file.name)
        );

        return {
          success: false,
          error: error?.message || "Upload failed",
        };
      } finally {
        setIsUploading(false);
      }
    },
    [isConnected]
  );

  const clearProgress = useCallback(() => {
    setUploadProgress([]);
  }, []);

  return {
    uploadFile,
    uploadProgress,
    isUploading,
    clearProgress,
  };
};

