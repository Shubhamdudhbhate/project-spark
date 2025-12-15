declare module './evidence-grid' {
  import { FC } from 'react';
  
  interface EvidenceGridProps {
    caseId: string;
  }
  
  const EvidenceGrid: FC<EvidenceGridProps>;
  
  export default EvidenceGrid;
}
