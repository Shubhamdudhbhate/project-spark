import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gavel, Scale, Users, Loader2, ArrowLeft, Eye, EyeOff, UserCheck, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type RoleCategory = 'judiciary' | 'legal_practitioner' | 'public_party';

const roleConfig = {
  judiciary: {
    title: 'Judiciary Portal',
    subtitle: 'Judges & Administrators',
    icon: Gavel,
    theme: 'text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    idLabel: 'Judge ID',
    idPlaceholder: 'e.g., JDG-2024-A1B2C',
  },
  legal_practitioner: {
    title: 'Legal Practitioner Portal',
    subtitle: 'Lawyers & Clerks',
    icon: Scale,
    theme: 'text-primary',
    border: 'border-primary/30',
    bg: 'bg-primary/10',
    idLabel: 'Bar Council ID',
    idPlaceholder: 'e.g., ADV-MH-12345',
  },
  public_party: {
    title: 'Public Portal',
    subtitle: 'Plaintiffs, Defendants & Citizens',
    icon: Users,
    theme: 'text-slate-400',
    border: 'border-slate-500/30',
    bg: 'bg-slate-500/10',
    idLabel: 'Citizen ID',
    idPlaceholder: 'e.g., CIT-2024-XYZ',
  },
};

const signInSchema = z.object({
  uniqueId: z.string().min(3, 'ID must be at least 3 characters').max(50, 'ID must be less than 50 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signUpSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  uniqueId: z.string()
    .min(3, 'ID must be at least 3 characters')
    .max(50, 'ID must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'ID can only contain letters, numbers, hyphens and underscores'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const roleParam = searchParams.get('role') as RoleCategory | null;
  const role: RoleCategory = roleParam && roleConfig[roleParam] ? roleParam : 'public_party';
  const config = roleConfig[role];
  const Icon = config.icon;

  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    fullName: '',
    uniqueId: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const checkUniqueIdExists = async (uniqueId: string): Promise<boolean> => {
    const { data } = await supabase
      .from('profiles')
      .select('unique_id')
      .eq('unique_id', uniqueId)
      .maybeSingle();
    return !!data;
  };

  const getEmailByUniqueId = async (uniqueId: string): Promise<string | null> => {
    const { data } = await supabase
      .from('profiles')
      .select('email')
      .eq('unique_id', uniqueId)
      .maybeSingle();
    return data?.email || null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      if (isSignUp) {
        const result = signUpSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach(err => {
            if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
          });
          setErrors(fieldErrors);
          setIsLoading(false);
          return;
        }

        // Check if unique ID already exists
        const idExists = await checkUniqueIdExists(formData.uniqueId);
        if (idExists) {
          setErrors({ uniqueId: 'This ID is already registered' });
          setIsLoading(false);
          return;
        }

        // Create email from unique ID for Supabase auth
        const generatedEmail = `${formData.uniqueId.toLowerCase()}@nyaysutra.court`;
        const redirectUrl = `${window.location.origin}/`;

        const { error } = await supabase.auth.signUp({
          email: generatedEmail,
          password: formData.password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: formData.fullName,
              role_category: role,
              unique_id: formData.uniqueId,
            },
          },
        });

        if (error) {
          toast.error(error.message);
          setIsLoading(false);
          return;
        }

        toast.success('Account created successfully! Welcome to NyaySutra.');
        navigate('/dashboard', { replace: true });
      } else {
        const result = signInSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach(err => {
            if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
          });
          setErrors(fieldErrors);
          setIsLoading(false);
          return;
        }

        // Get email associated with this unique ID
        const email = await getEmailByUniqueId(formData.uniqueId);
        if (!email) {
          setErrors({ uniqueId: 'No account found with this ID' });
          setIsLoading(false);
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: formData.password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setErrors({ password: 'Incorrect password' });
          } else {
            toast.error(error.message);
          }
          setIsLoading(false);
          return;
        }

        toast.success('Signed in successfully!');
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 grid-background" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Role Selection
        </Button>

        {/* Card */}
        <div className={cn(
          "glass-card p-8 rounded-2xl border-2",
          config.border
        )}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className={cn("absolute inset-0 blur-xl rounded-full opacity-50", config.theme.replace('text-', 'bg-'))} />
                <div className="relative w-16 h-16 rounded-xl bg-background/50 border border-white/10 flex items-center justify-center">
                  <Icon className={cn("w-8 h-8", config.theme)} />
                </div>
              </div>
            </div>
            <h1 className={cn("text-2xl font-bold", config.theme)}>
              {config.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {config.subtitle}
            </p>
          </div>

          {/* Toggle */}
          <div className="flex bg-secondary/50 rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                !isSignUp ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                isSignUp ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-muted-foreground" />
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={cn("bg-secondary/30", errors.fullName && 'border-destructive')}
                />
                {errors.fullName && (
                  <p className="text-xs text-destructive">{errors.fullName}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="uniqueId" className="flex items-center gap-2">
                <Key className="w-4 h-4 text-muted-foreground" />
                {config.idLabel}
              </Label>
              <Input
                id="uniqueId"
                name="uniqueId"
                placeholder={config.idPlaceholder}
                value={formData.uniqueId}
                onChange={handleChange}
                className={cn("bg-secondary/30 font-mono", errors.uniqueId && 'border-destructive')}
              />
              {errors.uniqueId && (
                <p className="text-xs text-destructive">{errors.uniqueId}</p>
              )}
              {isSignUp && (
                <p className="text-xs text-muted-foreground">
                  This unique ID will be used for all future logins
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className={cn("bg-secondary/30 pr-10", errors.password && 'border-destructive')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={cn("bg-secondary/30", errors.confirmPassword && 'border-destructive')}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              By continuing, you agree to NyaySutra's Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
