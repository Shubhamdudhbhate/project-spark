import { z } from "zod";

export const caseFormSchema = z.object({
  title: z.string().min(5, {
    message: "Title must be at least 5 characters.",
  }),
  caseNumber: z.string().regex(/^NYAY-\d{4}-\d{4}$/, {
    message: "Case number must be in the format NYAY-YYYY-XXXX",
  }),
  court: z.enum(["Session Court", "High Court", "District Court"], {
    required_error: "Please select a court type.",
  }),
  category: z.enum(["Criminal", "Civil", "Cybercrime", "Narcotics"], {
    required_error: "Please select a case category.",
  }),
  priority: z.enum(["Low", "Medium", "High"], {
    required_error: "Please select a priority level.",
  }),
});

export type CaseFormValues = z.infer<typeof caseFormSchema>;
