import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, MapPin, ChevronRight, LogOut, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

type Court = {
  id: string;
  name: string;
  code: string;
  type: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
};

const Courts = () => {
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const [courts, setCourts] = useState<Court[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCourt, setNewCourt] = useState({ name: '', description: '', address: '' });

  const fetchCourts = async () => {
    const { data, error } = await supabase
      .from('courts')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching courts:', error);
    } else {
      setCourts(data || []);
    }
    setIsLoading(false);
  };

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

    setIsCreating(true);
    const { error } = await supabase.from('courts').insert({
      name: newCourt.name.trim(),
      code: courtCode,
      address: newCourt.address.trim() || null,
    });

    if (error) {
      console.error('Error creating court:', error);
      toast.error('Failed to create court');
    } else {
      toast.success('Court created successfully');
      setNewCourt({ name: '', description: '', address: '' });
      setDialogOpen(false);
      fetchCourts();
    }
    setIsCreating(false);
  };

  const getRoleBadge = () => {
    if (!profile) return null;
    
    const roleStyles = {
      judiciary: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      legal_practitioner: 'bg-primary/20 text-primary border-primary/30',
      public_party: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    };

    const roleLabels = {
      judiciary: 'Judiciary',
      legal_practitioner: 'Legal Practitioner',
      public_party: 'Public',
    };

    return (
      <span className={cn(
        "px-3 py-1 rounded-full text-xs font-medium border",
        roleStyles[profile.role_category]
      )}>
        {roleLabels[profile.role_category]}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">NyaySutra</h1>
            <p className="text-sm text-muted-foreground">Court Management System</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground">{profile?.full_name}</p>
                <p className="text-xs text-muted-foreground">{profile?.email}</p>
              </div>
              {getRoleBadge()}
            </div>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Courts</h2>
              <p className="text-muted-foreground">
                Select a court to view its sections and case blocks
              </p>
            </div>
            
            {profile && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Court
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Court</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Court Name *</Label>
                      <Input
                        id="name"
                        placeholder="e.g., Supreme Court of India"
                        value={newCourt.name}
                        onChange={(e) => setNewCourt({ ...newCourt, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Brief description of the court"
                        value={newCourt.description}
                        onChange={(e) => setNewCourt({ ...newCourt, description: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        placeholder="Court address"
                        value={newCourt.address}
                        onChange={(e) => setNewCourt({ ...newCourt, address: e.target.value })}
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleCreateCourt}
                      disabled={isCreating}
                    >
                      {isCreating ? <LoadingSpinner size={16} /> : 'Create Court'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {courts.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No courts available</p>
              {profile && (
                <p className="text-sm text-muted-foreground mt-2">
                  Click "Add Court" to create your first court
                </p>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courts.map((court, index) => (
                <motion.button
                  key={court.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => navigate(`/courts/${court.id}/sections`)}
                  className="glass-card-hover p-6 text-left group"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {court.name}
                  </h3>
                  
                  {court.type && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {court.type}
                    </p>
                  )}
                  
                  {court.address && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {court.address}
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Courts;