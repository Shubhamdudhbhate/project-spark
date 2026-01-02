import { createContext, useContext, ReactNode, useMemo } from "react";
import { useAuth } from "./AuthContext";

export type CourtRole = "clerk" | "judge" | "observer";
export type RoleCategory = "judiciary" | "legal_practitioner" | "public_party";

export interface CourtUser {
  id: string;
  name: string;
  role: CourtRole;
  roleCategory: RoleCategory;
  department?: string;
  title?: string;
}

interface RoleContextType {
  currentUser: CourtUser | null;
  hasPermission: (action: PermissionAction) => boolean;
  // Permission flags for easy access
  canSeal: boolean;
  canUpload: boolean;
  canEditMetadata: boolean;
  canDeleteEvidence: boolean;
  canViewAuditLog: boolean;
  canViewEvidence: boolean;
  // Role-specific theming
  roleTheme: {
    primary: string;
    border: string;
    badge: string;
    glow: string;
  };
}

type PermissionAction =
  | "upload"
  | "edit_metadata"
  | "seal_evidence"
  | "view_evidence"
  | "delete_evidence"
  | "view_audit_log"
  | "start_session"
  | "end_session"
  | "grant_permission";

const ROLE_PERMISSIONS: Record<CourtRole, PermissionAction[]> = {
  clerk: [
    "upload",
    "edit_metadata",
    "view_evidence",
    "view_audit_log",
  ],
  judge: [
    "view_evidence",
    "seal_evidence",
    "view_audit_log",
    "start_session",
    "end_session",
    "grant_permission",
  ],
  observer: ["view_evidence", "view_audit_log"],
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

// Map role_category to CourtRole
const mapRoleCategoryToCourtRole = (roleCategory: string): CourtRole => {
  switch (roleCategory) {
    case "judiciary":
      return "judge";
    case "legal_practitioner":
      return "clerk";
    case "public_party":
    default:
      return "observer";
  }
};

// Role-specific theme configuration
const getRoleTheme = (roleCategory: RoleCategory) => {
  switch (roleCategory) {
    case "judiciary":
      return {
        primary: "amber-500",
        border: "amber-500/30",
        badge: "amber-500/20",
        glow: "amber-500/10",
      };
    case "legal_practitioner":
      return {
        primary: "blue-500",
        border: "blue-500/30",
        badge: "blue-500/20",
        glow: "blue-500/10",
      };
    case "public_party":
    default:
      return {
        primary: "slate-400",
        border: "slate-500/30",
        badge: "slate-500/20",
        glow: "slate-500/10",
      };
  };
};

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useAuth();

  const currentUser: CourtUser | null = useMemo(() => {
    if (!profile) return null;

    const roleCategory = profile.role_category as RoleCategory;
    const role = mapRoleCategoryToCourtRole(roleCategory);

    return {
      id: profile.id,
      name: profile.full_name,
      role,
      roleCategory,
      title:
        roleCategory === "judiciary"
          ? "Presiding Judge"
          : roleCategory === "legal_practitioner"
            ? "Legal Practitioner"
            : "Observer",
    };
  }, [profile]);

  const hasPermission = (action: PermissionAction): boolean => {
    if (!currentUser) return false;
    return ROLE_PERMISSIONS[currentUser.role].includes(action);
  };

  // Permission flags
  const permissions = useMemo(() => {
    if (!currentUser) {
      return {
        canSeal: false,
        canUpload: false,
        canEditMetadata: false,
        canDeleteEvidence: false,
        canViewAuditLog: false,
        canViewEvidence: false,
      };
    }

    return {
      canSeal: hasPermission("seal_evidence"),
      canUpload: hasPermission("upload"),
      canEditMetadata: hasPermission("edit_metadata"),
      canDeleteEvidence: false, // Only before sealing
      canViewAuditLog: hasPermission("view_audit_log"),
      canViewEvidence: hasPermission("view_evidence"),
    };
  }, [currentUser]);

  const roleTheme = useMemo(() => {
    if (!currentUser) {
      return getRoleTheme("public_party");
    }
    return getRoleTheme(currentUser.roleCategory);
  }, [currentUser]);

  const value: RoleContextType = {
    currentUser,
    hasPermission,
    ...permissions,
    roleTheme,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
};

export const getRoleColor = (role: CourtRole) => {
  switch (role) {
    case "judge":
      return "amber-500";
    case "clerk":
      return "blue-500";
    case "observer":
      return "slate-400";
    default:
      return "slate-400";
  }
};

export const getRoleLabel = (role: CourtRole) => {
  switch (role) {
    case "judge":
      return "Presiding Judge";
    case "clerk":
      return "Legal Practitioner";
    case "observer":
      return "Observer";
    default:
      return "Unknown";
  }
};
