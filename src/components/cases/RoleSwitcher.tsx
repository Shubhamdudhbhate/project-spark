import { Scale, UserCog, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRole, CourtRole, getRoleLabel } from "@/contexts/RoleContext";
import { cn } from "@/lib/utils";

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

export const RoleSwitcher = () => {
  const { currentUser } = useRole();

  if (!currentUser) return null;

  const config = ROLE_CONFIG[currentUser.role];
  const Icon = config.icon;

  return (
    <Button
      variant="outline"
      className={cn(
        "gap-2 border cursor-default",
        config.bgColor,
        config.color
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{currentUser.name}</span>
      <Badge variant="outline" className={cn("ml-1 text-xs", config.bgColor, config.color)}>
        {getRoleLabel(currentUser.role)}
      </Badge>
    </Button>
  );
};
