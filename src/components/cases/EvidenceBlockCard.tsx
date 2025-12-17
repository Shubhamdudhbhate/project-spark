import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Video, 
  Mic, 
  Folder, 
  ChevronDown, 
  ChevronUp,
  Upload,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type EvidenceBlockType = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
};

type Evidence = {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  status: string;
  uploaded_at: string;
  signed_at: string | null;
};

interface EvidenceBlockCardProps {
  block: {
    id: string;
    name: string;
    description: string | null;
    block_type: EvidenceBlockType;
  };
  evidence: Evidence[];
  canUpload: boolean;
  onUpload: (blockId: string) => void;
  onEvidenceClick: (evidence: Evidence) => void;
  onSign?: (evidence: Evidence) => void;
}

const iconMap: Record<string, typeof FileText> = {
  FileText,
  Video,
  Mic,
  Folder,
};

export const EvidenceBlockCard = ({
  block,
  evidence,
  canUpload,
  onUpload,
  onEvidenceClick,
  onSign,
}: EvidenceBlockCardProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const Icon = iconMap[block.block_type?.icon || 'Folder'] || Folder;
  
  const signedCount = evidence.filter(e => e.status === 'signed').length;
  const pendingCount = evidence.filter(e => e.status === 'pending').length;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'signed':
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Sealed</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">Pending Review</Badge>;
      default:
        return <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20">Draft</Badge>;
    }
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-foreground">{block.name}</h3>
            <p className="text-xs text-muted-foreground">
              {evidence.length} file{evidence.length !== 1 ? 's' : ''} • {signedCount} sealed
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
              {pendingCount} pending
            </Badge>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/5"
          >
            <div className="p-4 space-y-3">
              {block.description && (
                <p className="text-sm text-muted-foreground mb-4">{block.description}</p>
              )}

              {/* Evidence List */}
              {evidence.length > 0 ? (
                <div className="space-y-2">
                  {evidence.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg",
                        "bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer",
                        "border border-transparent hover:border-primary/20"
                      )}
                      onClick={() => onEvidenceClick(item)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{item.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(item.file_size)} • {new Date(item.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {getStatusBadge(item.status)}
                        {item.status === 'pending' && onSign && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSign(item);
                            }}
                          >
                            <Shield className="w-3 h-3 mr-1" />
                            Sign
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Folder className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No evidence in this block yet</p>
                </div>
              )}

              {/* Upload Button */}
              {canUpload && (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => onUpload(block.id)}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload to {block.name}
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
