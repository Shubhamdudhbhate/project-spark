// Type definitions for components

import { FC } from 'react';

declare module '@/components/cases/evidence-grid' {
  interface EvidenceGridProps {
    caseId: string;
  }
  
  const EvidenceGrid: FC<EvidenceGridProps>;
  export default EvidenceGrid;
}

// Global type declarations
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.svg' {
  import React = require('react');
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}
