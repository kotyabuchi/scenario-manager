import { z } from 'zod';

export const searchFormSchema = z.object({
  systemIds: z.array(z.string()).default([]),
  tagIds: z.array(z.string()).default([]),
  minPlayer: z.coerce.number().min(1).max(20).optional(),
  maxPlayer: z.coerce.number().min(1).max(20).optional(),
  minPlaytime: z.coerce.number().min(1).max(24).optional(),
  maxPlaytime: z.coerce.number().min(1).max(24).optional(),
  scenarioName: z.string().default(''),
});

export type SearchFormValues = z.infer<typeof searchFormSchema>;
