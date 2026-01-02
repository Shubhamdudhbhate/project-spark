// IPFS Service for evidence storage
const IPFS_GATEWAY = import.meta.env.VITE_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs/";
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY;

export interface IPFSUploadResult {
  cid: string;
  url: string;
  success: boolean;
  error?: string;
}

/**
 * Upload file to IPFS using Pinata
 */
export const uploadToIPFS = async (file: File): Promise<IPFSUploadResult> => {
  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    // Fallback: Return mock CID for development
    console.warn("IPFS credentials not configured, using mock CID");
    const mockCid = `Qm${Array.from({ length: 44 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("")}`;
    return {
      cid: mockCid,
      url: `${IPFS_GATEWAY}${mockCid}`,
      success: true,
    };
  }

  try {
    const formData = new FormData();
    formData.append("file", file);

    const metadata = JSON.stringify({
      name: file.name,
    });
    formData.append("pinataMetadata", metadata);

    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append("pinataOptions", options);

    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`IPFS upload failed: ${error}`);
    }

    const data = await response.json();
    const cid = data.IpfsHash;

    return {
      cid,
      url: `${IPFS_GATEWAY}${cid}`,
      success: true,
    };
  } catch (error: any) {
    console.error("IPFS upload error:", error);
    return {
      cid: "",
      url: "",
      success: false,
      error: error?.message || "Failed to upload to IPFS",
    };
  }
};

/**
 * Generate SHA-256 hash of file
 */
export const generateFileHash = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

