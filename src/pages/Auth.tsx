import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Gavel, Scale, Users, Loader2, ArrowLeft, Eye, EyeOff, Building2, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

type RoleCategory = 'judiciary' | 'legal_practitioner' | 'public_party';
type AuthStep = 'court_selection' | 'authentication';

type Court = {
  id: string;
  name: string;
  address: string | null;
};

const roleConfig = {
  judiciary: {
    title: 'Judiciary Portal',
    subtitle: 'Judges & Administrators',
    icon: Gavel,
    theme: 'text-amber-400',
    border: 'border-amber-500/30',
  },
  legal_practitioner: {
    title: 'Legal Practitioner Portal',
    subtitle: 'Lawyers & Clerks',
    icon: Scale,
    theme: 'text-primary',
    border: 'border-primary/30',
  },
  public_party: {
    title: 'Public Portal',
    subtitle: 'Plaintiffs, Defendants & Citizens',
    icon: Users,
    theme: 'text-slate-400',
    border: 'border-slate-500/30',
  },
};

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signUpSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signIn, signUp, isAuthenticated } = useAuth();
  
  const roleParam = searchParams.get('role') as RoleCategory | null;
  const role: RoleCategory = roleParam && roleConfig[roleParam] ? roleParam : 'public_party';
  const config = roleConfig[role];
  const Icon = config.icon;

  const [step, setStep] = useState<AuthStep>('court_selection');
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<string>('');
  const [isLoadingCourts, setIsLoadingCourts] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Add court dialog state
  const [showAddCourt, setShowAddCourt] = useState(false);
  const [isCreatingCourt, setIsCreatingCourt] = useState(false);
  const [newCourt, setNewCourt] = useState({ name: '', description: '', address: '' });
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/courts', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const fetchCourts = async () => {
    const { data, error } = await supabase
      .from('courts')
      .select('id, name, address')
      .order('name');

    if (error) {
      console.error('Error fetching courts:', error);
    } else {
      setCourts(data || []);
    }
    setIsLoadingCourts(false);
  };

  // Fetch courts on mount
  useEffect(() => {
    fetchCourts();
  }, []);

  const handleCreateCourt = async () => {
    if (!newCourt.name.trim()) {
      toast.error('Court name is required');
      return;
    }

    // Generate a court code from the name
    const courtCode = newCourt.name.trim().toUpperCase().replace(/\s+/g, '-').slice(0, 20) + '-' + Date.now().toString(36).toUpperCase();

    setIsCreatingCourt(true);
    const { data, error } = await supabase.from('courts').insert({
      name: newCourt.name.trim(),
      code: courtCode,
      address: newCourt.address.trim() || null,
    }).select().single();

    if (error) {
      console.error('Error creating court:', error);
      toast.error('Failed to create court');
    } else {
      toast.success('Court created successfully');
      setNewCourt({ name: '', description: '', address: '' });
      setShowAddCourt(false);
      await fetchCourts();
      if (data) {
        setSelectedCourt(data.id);
      }
    }
    setIsCreatingCourt(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleCourtSelect = (courtId: string) => {
    setSelectedCourt(courtId);
  };

  const handleProceedToAuth = () => {
    if (!selectedCourt) {
      setErrors({ court: 'Please select a court to continue' });
      return;
    }
    setStep('authentication');
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

        const { error } = await signUp(formData.email, formData.password, formData.fullName, role);
        if (!error) {
          navigate('/courts', { replace: true });
        }
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

        const { error } = await signIn(formData.email, formData.password);
        if (!error) {
          navigate('/courts', { replace: true });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCourtData = courts.find(c => c.id === selectedCourt);

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
          onClick={() => step === 'authentication' ? setStep('court_selection') : navigate('/')}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {step === 'authentication' ? 'Back to Court Selection' : 'Back to Role Selection'}
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

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
              step === 'court_selection' 
                ? "bg-primary/20 text-primary border border-primary/30" 
                : "bg-secondary/50 text-muted-foreground"
            )}>
              <Building2 className="w-3.5 h-3.5" />
              Court
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
              step === 'authentication' 
                ? "bg-primary/20 text-primary border border-primary/30" 
                : "bg-secondary/50 text-muted-foreground"
            )}>
              <Shield className="w-3.5 h-3.5" />
              Sign In
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 'court_selection' ? (
              <motion.div
                key="court_selection"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Select Court</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddCourt(true)}
                      className="text-xs h-7 px-2"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Court
                    </Button>
                  </div>
                  {isLoadingCourts ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : courts.length === 0 ? (
                    <div className="text-center py-8">
                      <Building2 className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-sm text-muted-foreground mb-3">No courts available</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddCourt(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Court
                      </Button>
                    </div>
                  ) : (
                    <Select value={selectedCourt} onValueChange={handleCourtSelect}>
                      <SelectTrigger className={cn(
                        "bg-secondary/30 border-white/10",
                        errors.court && "border-destructive"
                      )}>
                        <SelectValue placeholder="Choose your court..." />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-white/10">
                        {courts.map((court) => (
                          <SelectItem key={court.id} value={court.id}>
                            <div className="flex flex-col items-start">
                              <span>{court.name}</span>
                              {court.address && (
                                <span className="text-xs text-muted-foreground">{court.address}</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {errors.court && (
                    <p className="text-xs text-destructive">{errors.court}</p>
                  )}
                </div>

                {selectedCourtData && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg bg-secondary/30 border border-white/5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{selectedCourtData.name}</p>
                        {selectedCourtData.address && (
                          <p className="text-xs text-muted-foreground mt-1">{selectedCourtData.address}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                <Button
                  onClick={handleProceedToAuth}
                  className="w-full"
                  disabled={!selectedCourt}
                >
                  Continue to Sign In
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="authentication"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Selected Court Badge */}
                {selectedCourtData && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/30 border border-white/5 text-sm">
                    <Building2 className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">Court:</span>
                    <span className="font-medium">{selectedCourtData.name}</span>
                  </div>
                )}

                {/* Toggle */}
                <div className="flex bg-secondary/50 rounded-lg p-1">
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
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={handleChange}
                        className={errors.fullName ? 'border-destructive' : ''}
                      />
                      {errors.fullName && (
                        <p className="text-xs text-destructive">{errors.fullName}</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email}</p>
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
                        className={cn("pr-10", errors.password ? 'border-destructive' : '')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                        className={errors.confirmPassword ? 'border-destructive' : ''}
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-sm text-muted-foreground">
          <Shield className="w-4 h-4 inline-block mr-1" />
          Secured with end-to-end encryption
        </p>
      </motion.div>

      {/* Add Court Dialog */}
      <Dialog open={showAddCourt} onOpenChange={setShowAddCourt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Court</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="courtName">Court Name *</Label>
              <Input
                id="courtName"
                placeholder="e.g., Supreme Court of India"
                value={newCourt.name}
                onChange={(e) => setNewCourt({ ...newCourt, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="courtDescription">Description</Label>
              <Textarea
                id="courtDescription"
                placeholder="Brief description of the court"
                value={newCourt.description}
                onChange={(e) => setNewCourt({ ...newCourt, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="courtAddress">Address</Label>
              <Input
                id="courtAddress"
                placeholder="Court address"
                value={newCourt.address}
                onChange={(e) => setNewCourt({ ...newCourt, address: e.target.value })}
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleCreateCourt}
              disabled={isCreatingCourt}
            >
              {isCreatingCourt ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Court'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
