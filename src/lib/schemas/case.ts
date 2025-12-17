import { z } from 'zod';

// Indian Courts List
export const INDIAN_COURTS = [
  { code: 'SC', name: 'Supreme Court of India', prefix: 'SC' },
  { code: 'DHC', name: 'Delhi High Court', prefix: 'DHC' },
  { code: 'BHC', name: 'Bombay High Court', prefix: 'BHC' },
  { code: 'MHC', name: 'Madras High Court', prefix: 'MHC' },
  { code: 'CHC', name: 'Calcutta High Court', prefix: 'CHC' },
  { code: 'KHC', name: 'Karnataka High Court', prefix: 'KHC' },
  { code: 'GHC', name: 'Gujarat High Court', prefix: 'GHC' },
  { code: 'APHC', name: 'Andhra Pradesh High Court', prefix: 'APHC' },
  { code: 'THC', name: 'Telangana High Court', prefix: 'THC' },
  { code: 'KER', name: 'Kerala High Court', prefix: 'KER' },
  { code: 'PHC', name: 'Punjab & Haryana High Court', prefix: 'PHC' },
  { code: 'AHC', name: 'Allahabad High Court', prefix: 'AHC' },
  { code: 'RHC', name: 'Rajasthan High Court', prefix: 'RHC' },
  { code: 'MPHC', name: 'Madhya Pradesh High Court', prefix: 'MPHC' },
  { code: 'JHC', name: 'Jharkhand High Court', prefix: 'JHC' },
  { code: 'DIST', name: 'District Court', prefix: 'DIST' },
  { code: 'SESS', name: 'Sessions Court', prefix: 'SESS' },
] as const;

export type CourtCode = typeof INDIAN_COURTS[number]['code'];

// Case Categories
export const CASE_CATEGORIES = [
  'Criminal',
  'Civil',
  'Constitutional',
  'Tax',
  'Labor',
  'Family',
  'Property',
  'Corporate',
  'Environmental',
  'Cyber Crime',
  'Financial Fraud',
  'Other',
] as const;

export type CaseCategory = typeof CASE_CATEGORIES[number];

export const caseFormSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters'),
  courtCode: z.string().min(1, 'Court is required'),
  presidingJudge: z.string()
    .min(2, 'Judge name must be at least 2 characters')
    .max(100, 'Judge name must be less than 100 characters'),
  category: z.string().min(1, 'Category is required'),
  description: z.string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional(),
  status: z.enum(['open', 'pending', 'closed']).default('open'),
});

export type CaseFormValues = z.infer<typeof caseFormSchema>;

// Generate case number based on court code
export const generateCaseNumber = (courtCode: string): string => {
  const year = new Date().getFullYear();
  const sequence = Math.floor(1000 + Math.random() * 9000);
  return `${courtCode}-${year}-${sequence}`;
};