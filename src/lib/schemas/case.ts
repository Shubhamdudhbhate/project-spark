import { z } from 'zod';

export const caseFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  caseNumber: z.string().regex(/^NYAY-\d{4}-\d{4}$/, 'Invalid case number format'),
  court: z.string().min(1, 'Court is required'),
  category: z.string().min(1, 'Category is required'),
  priority: z.enum(['Low', 'Medium', 'High']),
  description: z.string().optional(),
});

export type CaseFormValues = z.infer<typeof caseFormSchema>;
