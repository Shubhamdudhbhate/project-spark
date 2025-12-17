import { motion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Shield,
  FolderOpen,
  History,
  Settings,
  LogOut,
  Scale,
  UserCog,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRole, CourtRole, getRoleLabel } from "@/contexts/RoleContext";


const navItems = [
  { icon: FolderOpen, label: "My Cases", href: "/courts" },
  { icon: History, label: "Audit Logs", href: "/dashboard/logs" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

const ROLE_CONFIG: Record<CourtRole, { icon: typeof Scale; color: string; bgColor: string }> = {
  judge: {
    icon: Scale,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10 border-amber-500/20",
  },
  clerk: {
    icon: UserCog,
    color: "text-primary",
    bgColor: "bg-primary/10 border-primary/20",
  },
  observer: {
    icon: Eye,
    color: "text-slate-400",
    bgColor: "bg-slate-500/10 border-slate-500/20",
  },
};

interface SidebarProps {
  collapsed?: boolean;
}

export const Sidebar = ({ collapsed = false }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { currentUser } = useRole();

  const handleLogout = () => {
    signOut();
    navigate('/', { replace: true });
  };

  const config = currentUser ? ROLE_CONFIG[currentUser.role] : ROLE_CONFIG.clerk;
  const RoleIcon = config.icon;

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "fixed left-0 top-0 bottom-0 z-40 glass-card border-r border-white/5 flex flex-col transition-all duration-300",
        collapsed ? "w-20" : "w-64",
        currentUser?.role === "judge" && "border-r-amber-500/20"
      )}
    >
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <Link to="/" className="flex items-center gap-3">
          <div className="relative">
            <div className={cn(
              "absolute inset-0 blur-xl",
              currentUser?.role === "judge" ? "bg-amber-500/20" : "bg-primary/20"
            )} />
            <Shield className={cn(
              "relative w-8 h-8",
              currentUser?.role === "judge" ? "text-amber-400" : "text-primary"
            )} />
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xl font-bold tracking-tight"
            >
              NyaySutra
            </motion.span>
          )}
        </Link>
      </div>

      {/* Role Display with Greeting */}
      {!collapsed && currentUser && (
        <div className="p-4 border-b border-white/5">
          <div className={cn(
            "p-4 rounded-lg border",
            config.bgColor
          )}>
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                "bg-background/50 border border-white/10"
              )}>
                <RoleIcon className={cn("w-5 h-5", config.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("font-bold text-sm", config.color)}>
                  {currentUser.role === 'judge' && 'Honorable Judge'}
                  {currentUser.role === 'clerk' && 'Legal Practitioner'}
                  {currentUser.role === 'observer' && 'Citizen'}
                </p>
                <p className={cn("text-sm truncate", config.color)}>
                  {currentUser.name}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {getRoleLabel(currentUser.role)}
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link key={item.href} to={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  isActive
                    ? currentUser?.role === "judge"
                      ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                      : "bg-primary/10 border border-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
                {isActive && !collapsed && (
                  <div className={cn(
                    "ml-auto w-1.5 h-1.5 rounded-full",
                    currentUser?.role === "judge" ? "bg-amber-400" : "bg-primary"
                  )} />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/5">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all",
            collapsed ? "justify-center" : "justify-start"
          )}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="ml-3">Logout</span>}
        </Button>
      </div>
    </motion.aside>
  );
};
