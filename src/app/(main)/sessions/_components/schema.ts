import { z } from 'zod';

export const searchFormSchema = z.object({
  systems: z.array(z.string()),
  phases: z.array(z.string()),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  q: z.string(),
});

export type SearchFormValues = z.infer<typeof searchFormSchema>;
