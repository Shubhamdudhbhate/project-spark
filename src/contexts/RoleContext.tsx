import { createContext, useContext, ReactNode } from "react";
import { useAuth } from "./AuthContext";

export type CourtRole = "clerk" | "judge" | "observer";

export interface CourtUser {
  id: string;
  name: string;
  role: CourtRole;
  department?: string;
  title?: string;
}

interface RoleContextType {
  currentUser: CourtUser | null;
  hasPermission: (action: PermissionAction) => boolean;
}

type PermissionAction = 
  | "upload"
  | "edit_metadata"
  | "seal_evidence"
  | "view_evidence"
  | "delete_evidence"
  | "view_audit_log";

const ROLE_PERMISSIONS: Record<CourtRole, PermissionAction[]> = {
  clerk: ["upload", "edit_metadata", "view_evidence", "view_audit_log"],
  judge: ["view_evidence", "seal_evidence", "view_audit_log"],
  observer: ["view_evidence", "view_audit_log"],
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

// Map role_category to CourtRole
const mapRoleCategoryToCourtRole = (roleCategory: string): CourtRole => {
  switch (roleCategory) {
    case 'judiciary':
      return 'judge';
    case 'legal_practitioner':
      return 'clerk';
    case 'public_party':
    default:
      return 'observer';
  }
};

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useAuth();

  const currentUser: CourtUser | null = profile ? {
    id: profile.id,
    name: profile.full_name,
    role: mapRoleCategoryToCourtRole(profile.role_category),
    department: undefined,
    title: profile.role_category === 'judiciary' 
      ? 'Presiding Judge' 
      : profile.role_category === 'legal_practitioner' 
        ? 'Legal Practitioner' 
        : 'Observer',
  } : null;

  const hasPermission = (action: PermissionAction): boolean => {
    if (!currentUser) return false;
    return ROLE_PERMISSIONS[currentUser.role].includes(action);
  };

  return (
    <RoleContext.Provider value={{ currentUser, hasPermission }}>
      {children}
    </RoleContext.Provider>
  );
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
      return "gold";
    case "clerk":
      return "blue";
    case "observer":
      return "slate";
    default:
      return "slate";
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
