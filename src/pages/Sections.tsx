import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layers, ChevronRight, ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type Section = {
  id: string;
  name: string;
  description: string | null;
  court_id: string;
};

type Court = {
  id: string;
  name: string;
};

const Sections = () => {
  const { courtId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [sections, setSections] = useState<Section[]>([]);
  const [court, setCourt] = useState<Court | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionDescription, setNewSectionDescription] = useState('');

  const fetchData = async () => {
    if (!courtId) return;

    // Fetch court details
    const { data: courtData } = await supabase
      .from('courts')
      .select('id, name')
      .eq('id', courtId)
      .maybeSingle();

    if (courtData) setCourt(courtData);

    // Fetch sections
    const { data: sectionsData, error } = await supabase
      .from('sections')
      .select('*')
      .eq('court_id', courtId)
      .order('name');

    if (error) {
      console.error('Error fetching sections:', error);
    } else {
      setSections(sectionsData || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [courtId]);

  const canCreateSection = profile?.role_category === 'judiciary' || profile?.role_category === 'legal_practitioner';

  const handleCreateSection = async () => {
    if (!newSectionName.trim() || !courtId) return;

    // Generate a section code
    const sectionCode = newSectionName.trim().toUpperCase().replace(/\s+/g, '-').slice(0, 15) + '-' + Date.now().toString(36).toUpperCase();

    setIsCreating(true);
    try {
      const { error } = await supabase.from('sections').insert({
        name: newSectionName.trim(),
        code: sectionCode,
        description: newSectionDescription.trim() || null,
        court_id: courtId,
      });

      if (error) throw error;

      toast.success(`Section "${newSectionName}" created successfully`);
      setNewSectionName('');
      setNewSectionDescription('');
      setCreateDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error creating section:', error);
      toast.error('Failed to create section');
    } finally {
      setIsCreating(false);
    }
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
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/courts')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">{court?.name}</h1>
              <p className="text-sm text-muted-foreground">Select a Section</p>
            </div>
            {canCreateSection && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Section
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => navigate('/courts')} className="hover:text-foreground">
            Courts
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground">{court?.name}</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Sections</h2>
            <p className="text-muted-foreground">
              Choose a section to view case blocks
            </p>
          </div>

          {sections.length === 0 ? (
            <div className="text-center py-16">
              <Layers className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Sections Yet</h3>
              <p className="text-muted-foreground mb-6">
                This court doesn't have any sections. Create one to start organizing cases.
              </p>
              {canCreateSection && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Section
                </Button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sections.map((section, index) => (
                <motion.button
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => navigate(`/sections/${section.id}/blocks`)}
                  className="glass-card-hover p-6 text-left group"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Layers className="w-6 h-6 text-primary" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {section.name}
                  </h3>
                  
                  {section.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {section.description}
                    </p>
                  )}
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      {/* Create Section Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="glass-card border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Create New Section
            </DialogTitle>
            <DialogDescription>
              Add a new section to organize cases in this court.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="section-name">Section Name *</Label>
              <Input
                id="section-name"
                placeholder="e.g., Cyber Crime Division"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                className="bg-secondary/30 border-white/10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="section-description">Description</Label>
              <Textarea
                id="section-description"
                placeholder="Brief description of this section..."
                value={newSectionDescription}
                onChange={(e) => setNewSectionDescription(e.target.value)}
                className="min-h-[80px] bg-secondary/30 border-white/10"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateSection}
                disabled={isCreating || !newSectionName.trim()}
                className="glow-button"
              >
                {isCreating ? 'Creating...' : 'Create Section'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sections;
