import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Folder, Scale, FileText, ChevronRight, Gavel } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/contexts/AuthContext';
import { CreateCaseDialog } from '@/components/cases/CreateCaseDialog';
import { cn } from '@/lib/utils';

type Section = {
  id: string;
  name: string;
  description: string | null;
  court_id: string;
  courts: {
    id: string;
    name: string;
  } | null;
};

type Case = {
  id: string;
  case_number: string;
  title: string;
  description: string | null;
  status: string | null;
  filing_date: string | null;
  created_at: string | null;
  judge_id: string;
  judge?: {
    id: string;
    full_name: string;
  } | null;
};

const CaseBlocks = () => {
  const { sectionId } = useParams<{ sectionId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [section, setSection] = useState<Section | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createCaseOpen, setCreateCaseOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!sectionId) return;

      try {
        // Fetch section with court info
        const { data: sectionData, error: sectionError } = await supabase
          .from('sections')
          .select(`
            id,
            name,
            description,
            court_id,
            courts (
              id,
              name
            )
          `)
          .eq('id', sectionId)
          .maybeSingle();

        if (sectionError) {
          console.error('Error fetching section:', sectionError);
          return;
        }

        setSection(sectionData as Section);

        // Fetch cases in this section with judge information
        const { data: casesData, error: casesError } = await supabase
          .from('cases')
          .select(`
            *,
            judge:profiles!cases_judge_id_fkey(
              id,
              full_name
            )
          `)
          .eq('section_id', sectionId)
          .order('created_at', { ascending: false });

        if (casesError) {
          console.error('Error fetching cases:', casesError);
          return;
        }

        // Transform the data to match our Case type
        const transformedCases = (casesData || []).map((caseItem: any) => ({
          ...caseItem,
          judge: caseItem.judge || null,
        }));

        setCases(transformedCases);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [sectionId]);

  const canCreateCase = profile?.role_category === 'judiciary' || profile?.role_category === 'legal_practitioner';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'closed':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      case 'pending':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'archived':
        return 'bg-muted text-muted-foreground border-muted';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const handleCaseCreated = async () => {
    if (!sectionId) return;
    
    const { data } = await supabase
      .from('cases')
      .select(`
        *,
        judge:profiles!cases_judge_id_fkey(
          id,
          full_name
        )
      `)
      .eq('section_id', sectionId)
      .order('created_at', { ascending: false });

    const transformedCases = (data || []).map((caseItem: any) => ({
      ...caseItem,
      judge: caseItem.judge || null,
    }));

    setCases(transformedCases);
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/courts/${section?.court_id}/sections`)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Scale className="w-4 h-4" />
                <span>{section?.courts?.name || 'Court'}</span>
              </div>
              <h1 className="text-xl font-bold text-foreground">{section?.name || 'Section'}</h1>
            </div>
            {canCreateCase && (
              <Button onClick={() => setCreateCaseOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Case
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <button
            onClick={() => navigate('/courts')}
            className="hover:text-foreground transition-colors"
          >
            Courts
          </button>
          <ChevronRight className="w-4 h-4" />
          <button
            onClick={() => navigate(`/courts/${section?.court_id}/sections`)}
            className="hover:text-foreground transition-colors"
          >
            {section?.courts?.name}
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground">{section?.name}</span>
        </nav>

        {/* Cases Grid */}
        {cases.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cases.map((caseItem, index) => (
              <motion.div
                key={caseItem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/cases/${caseItem.id}`)}
                className={cn(
                  "glass-card p-5 cursor-pointer transition-all duration-300",
                  "hover:scale-[1.02] hover:shadow-lg hover:border-primary/30"
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <Badge variant="outline" className={getStatusColor(caseItem.status || 'pending')}>
                    {(caseItem.status || 'pending').charAt(0).toUpperCase() + (caseItem.status || 'pending').slice(1)}
                  </Badge>
                </div>

                <h3 className="font-semibold text-foreground mb-1 line-clamp-2">
                  {caseItem.title}
                </h3>
                <p className="text-sm font-mono text-muted-foreground mb-3">
                  {caseItem.case_number}
                </p>

                {caseItem.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {caseItem.description}
                  </p>
                )}

                <div className="space-y-2">
                  {caseItem.judge && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Gavel className="w-3.5 h-3.5 text-amber-400" />
                      <span className="truncate">
                        Judge: <span className="font-medium text-foreground">{caseItem.judge.full_name}</span>
                      </span>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Filed: {caseItem.filing_date ? new Date(caseItem.filing_date).toLocaleDateString('en-IN') : 'N/A'}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Folder className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Cases Yet</h3>
            <p className="text-muted-foreground mb-6">
              This section doesn't have any cases. Create the first one to get started.
            </p>
            {canCreateCase && (
              <Button onClick={() => setCreateCaseOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Case
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Create Case Dialog */}
      {sectionId && (
        <CreateCaseDialog
          open={createCaseOpen}
          onOpenChange={setCreateCaseOpen}
          sectionId={sectionId}
          onCaseCreated={handleCaseCreated}
        />
      )}
    </div>
  );
};

export default CaseBlocks;
