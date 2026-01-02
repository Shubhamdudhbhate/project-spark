import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { toast } from "sonner";

// Simplified Web3 Context - will be enhanced when wagmi is installed
interface Web3ContextType {
  address: string | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => void;
  disconnect: () => void;
  signMessage: (message: string) => Promise<string | null>;
  isSigning: boolean;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

// Temporary implementation - will be replaced with wagmi when installed
export const Web3Provider = ({ children }: { children: ReactNode }) => {
  const [address, setAddress] = useState<string | undefined>();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  const connect = async () => {
    if (typeof window.ethereum === "undefined") {
      toast.error("MetaMask not found. Please install MetaMask.");
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
        toast.success("Wallet connected");
      }
    } catch (error: any) {
      console.error("Connection error:", error);
      toast.error(error?.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAddress(undefined);
    setIsConnected(false);
    toast.info("Wallet disconnected");
  };

  const signMessage = async (message: string): Promise<string | null> => {
    if (!isConnected || !address || typeof window.ethereum === "undefined") {
      toast.error("Please connect your wallet first");
      return null;
    }

    setIsSigning(true);
    try {
      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [message, address],
      });
      return signature as string;
    } catch (error: any) {
      console.error("Signing error:", error);
      if (error.code !== 4001) {
        // Not user rejection
        toast.error(error?.message || "Failed to sign message");
      }
      return null;
    } finally {
      setIsSigning(false);
    }
  };

  // Check if already connected
  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            setAddress(accounts[0]);
            setIsConnected(true);
          }
        })
        .catch(console.error);

      // Listen for account changes
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts && accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
        } else {
          setAddress(undefined);
          setIsConnected(false);
        }
      });
    }
  }, []);

  const value: Web3ContextType = {
    address,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    signMessage,
    isSigning,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (args: any) => void) => void;
      removeListener: (event: string, handler: (args: any) => void) => void;
    };
  }
}
