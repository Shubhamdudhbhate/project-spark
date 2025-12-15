import { z } from 'zod';

export const caseFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  caseNumber: z.string().regex(/^NYAY-\d{4}-\d{4}$/, 'Invalid case number format'),
  courtName: z.string().min(1, 'Court name is required'),
  presidingJudge: z.string().min(1, 'Presiding judge is required'),
  status: z.enum(['open', 'pending', 'closed']),
  description: z.string().optional(),
});

export type CaseFormValues = z.infer<typeof caseFormSchema>;
