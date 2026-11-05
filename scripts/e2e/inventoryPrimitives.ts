import { z } from 'zod';

/** 表示位置は安定IDとは分離する。 */
export const sourceLocationSchema = z
  .object({
    file: z.string().min(1),
    line: z.number().int().positive(),
    column: z.number().int().positive(),
  })
  .strict();

export const diagnosticAnchorSchema = z
  .object({
    ownerId: z.string().min(1),
    syntaxHash: z.string().regex(/^[a-f0-9]{64}$/),
    occurrence: z.number().int().nonnegative(),
  })
  .strict();
