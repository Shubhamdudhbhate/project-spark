import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ListOrdered,
  FolderOpen,
  PenLine,
  Archive,
  Calendar,
  BarChart3,
  LogOut,
  Activity,
  Scale,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { id: "cause-list", label: "Today's Cause List", icon: ListOrdered, path: "/cause-list" },
  { id: "cases", label: "Case Repository", icon: FolderOpen, path: "/cases" },
  { id: "judgment", label: "Judgment Writer", icon: PenLine, path: "/judgment" },
  { id: "evidence", label: "Evidence Vault", icon: Archive, path: "/evidence" },
  { id: "calendar", label: "Court Calendar", icon: Calendar, path: "/calendar" },
  { id: "analytics", label: "Analytics", icon: BarChart3, path: "/analytics" },
];

const bottomNavItems: NavItem[] = [
  { id: "health", label: "System Health", icon: Activity, path: "/health" },
  { id: "logout", label: "Log Out", icon: LogOut, path: "/auth" },
];

export const NyaySutraSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  const NavItemComponent = ({ item, isBottom = false }: { item: NavItem; isBottom?: boolean }) => {
    const Icon = item.icon;
    const active = isActive(item.path);

    const content = (
      <button
        onClick={() => navigate(item.path)}
        className={cn(
          "nav-item w-full",
          active && "active",
          isBottom && item.id === "logout" && "text-destructive/70 hover:text-destructive hover:bg-destructive/10"
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {!collapsed && <span>{item.label}</span>}
        {!collapsed && item.badge && (
          <span className="ml-auto bg-urgent text-urgent-foreground text-xs font-bold px-2 py-0.5 rounded-full">
            {item.badge}
          </span>
        )}
      </button>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-sidebar-background border-r border-sidebar-border flex flex-col transition-all duration-300 z-50",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
            <Scale className="h-6 w-6 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-lg text-sidebar-foreground">NyaySutra</h1>
              <p className="text-xs text-sidebar-foreground/60">Digital Court System</p>
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => (
            <NavItemComponent key={item.id} item={item} />
          ))}
        </nav>

        {/* Bottom Navigation */}
        <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
          {bottomNavItems.map((item) => (
            <NavItemComponent key={item.id} item={item} isBottom />
          ))}
        </div>

        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-7 h-6 w-6 rounded-full border bg-background shadow-md hover:bg-muted"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </Button>
      </aside>
    </TooltipProvider>
  );
};
