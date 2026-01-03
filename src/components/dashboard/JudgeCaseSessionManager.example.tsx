/**
 * USAGE EXAMPLE for JudgeCaseSessionManager Component
 * 
 * This component can be integrated into:
 * 1. Case Details Page
 * 2. Judge Dashboard
 * 3. Standalone Session Management Page
 */

import { JudgeCaseSessionManager } from "./JudgeCaseSessionManager";

// Example 1: Usage in Case Details Page
export function CaseDetailsPageExample() {
  const caseId = "case-12345";
  const caseName = "State vs. John Doe";
  const caseNumber = "CR-2024-001234";

  return (
    <div className="container mx-auto p-6">
      <JudgeCaseSessionManager
        caseId={caseId}
        caseName={caseName}
        caseNumber={caseNumber}
      />
    </div>
  );
}

// Example 2: Usage with Dynamic Case Data
export function DynamicCaseExample({ caseData }: { caseData: any }) {
  return (
    <JudgeCaseSessionManager
      caseId={caseData.id}
      caseName={caseData.title}
      caseNumber={caseData.case_number}
    />
  );
}

