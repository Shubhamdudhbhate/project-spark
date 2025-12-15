import { motion } from "framer-motion";
import { User, BadgeCheck, Building2, Calendar, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AuthorizedPerson } from "@/types/case";

interface AuthorizedPersonnelProps {
  personnel: AuthorizedPerson[];
}

export const AuthorizedPersonnel = ({ personnel }: AuthorizedPersonnelProps) => {
  return (
    <div className="space-y-4">
      {personnel.map((person, index) => (
        <motion.div
          key={person.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="glass-card p-5"
        >
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-lg" />
              <div className="relative p-3 rounded-xl bg-primary/10 border border-primary/20">
                <User className="w-6 h-6 text-primary" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">{person.name}</h4>
                <BadgeCheck className="w-4 h-4 text-emerald-400" />
              </div>

              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary/20 mb-3"
              >
                {person.role}
              </Badge>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="w-4 h-4" />
                  <span>{person.department}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span className="font-mono text-xs">{person.govId}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Added{" "}
                    {new Date(person.addedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
