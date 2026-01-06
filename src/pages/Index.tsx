import { forwardRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gavel, Scale, Users, Shield, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

type RoleCategory = 'judiciary' | 'legal_practitioner' | 'public_party';

interface RoleBlock {
  category: RoleCategory;
  title: string;
  subtitle: string;
  icon: typeof Gavel;
  description: string;
  features: string[];
  theme: {
    border: string;
    glow: string;
    icon: string;
    bg: string;
  };
}

const roleBlocks: RoleBlock[] = [
  {
    category: 'judiciary',
    title: 'Judiciary',
    subtitle: 'Judges & Administrators',
    icon: Gavel,
    description: 'Preside over cases, review evidence, and apply digital signatures for final verdicts.',
    features: ['Sign Evidence', 'Seal Cases', 'Manage Courts'],
    theme: {
      border: 'border-amber-500/50 hover:border-amber-400',
      glow: 'bg-amber-500/20',
      icon: 'text-amber-400',
      bg: 'from-amber-500/10 to-transparent',
    },
  },
  {
    category: 'legal_practitioner',
    title: 'Legal Practitioners',
    subtitle: 'Lawyers & Clerks',
    icon: Scale,
    description: 'Upload evidence, manage case files, and maintain chain-of-custody records.',
    features: ['Upload Evidence', 'File Cases', 'Track Custody'],
    theme: {
      border: 'border-primary/50 hover:border-primary',
      glow: 'bg-primary/20',
      icon: 'text-primary',
      bg: 'from-primary/10 to-transparent',
    },
  },
  {
    category: 'public_party',
    title: 'Public / Parties',
    subtitle: 'Plaintiffs, Defendants & Citizens',
    icon: Users,
    description: 'Access your cases, view verified evidence, and track case progress.',
    features: ['View Cases', 'Track Status', 'Verify Evidence'],
    theme: {
      border: 'border-slate-500/30 hover:border-slate-400',
      glow: 'bg-slate-500/10',
      icon: 'text-slate-400',
      bg: 'from-slate-500/10 to-transparent',
    },
  },
];

const Index = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleRoleSelect = (category: RoleCategory) => {
    navigate(`/auth?role=${category}`);
  };

  return (
    <div ref={ref} className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 grid-background" />
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px]" />

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full scale-150" />
              <Shield className="relative w-20 h-20 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
            <span className="text-gradient-blue">NyaySutra</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Digital Court Management & Evidence Verification System
          </p>
          <p className="mt-4 text-muted-foreground/70">
            Secure, transparent, and immutable judicial proceedings
          </p>
        </motion.div>

        {/* 3-Block Role Selection */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-center text-lg text-muted-foreground mb-8">
            Select your role to continue
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {roleBlocks.map((block, index) => {
              const Icon = block.icon;
              
              return (
                <motion.button
                  key={block.category}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  onClick={() => handleRoleSelect(block.category)}
                  className={cn(
                    "relative group p-8 rounded-2xl border-2 transition-all duration-300",
                    "bg-card/50 backdrop-blur-sm text-left",
                    "hover:scale-[1.02] hover:shadow-2xl cursor-pointer",
                    block.theme.border
                  )}
                >
                  {/* Glow Effect */}
                  <div className={cn(
                    "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl -z-10",
                    block.theme.glow
                  )} />
                  
                  {/* Gradient Overlay */}
                  <div className={cn(
                    "absolute inset-0 rounded-2xl bg-gradient-to-b opacity-50",
                    block.theme.bg
                  )} />

                  <div className="relative z-10">
                    {/* Icon */}
                    <div className={cn(
                      "w-16 h-16 rounded-xl flex items-center justify-center mb-6",
                      "bg-background/50 border border-white/10"
                    )}>
                      <Icon className={cn("w-8 h-8", block.theme.icon)} />
                    </div>

                    {/* Content */}
                    <div className="space-y-3 mb-6">
                      <div>
                        <h3 className={cn("text-2xl font-bold", block.theme.icon)}>
                          {block.title}
                        </h3>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                          {block.subtitle}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {block.description}
                      </p>
                    </div>

                    {/* Features */}
                    <div className="space-y-2 mb-6">
                      {block.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className={cn("w-1.5 h-1.5 rounded-full", block.theme.icon.replace('text-', 'bg-'))} />
                          {feature}
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <div className={cn(
                      "flex items-center gap-2 text-sm font-medium",
                      block.theme.icon
                    )}>
                      Enter Portal
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-sm text-muted-foreground/60"
        >
          <p>Powered by secure cryptographic verification</p>
        </motion.div>
      </div>
    </div>
  );
});
Index.displayName = "Index";

export default Index;