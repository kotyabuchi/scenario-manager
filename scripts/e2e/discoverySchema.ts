import { z } from 'zod';

const text = z.string().min(1);
export const discoveryTestSchema = z.strictObject({
  testId: text,
  file: text,
  line: z.number().int().positive(),
  column: z.number().int().positive(),
  titlePath: z.array(text).min(1),
  project: z.string(),
  repeatEachIndex: z.number().int().nonnegative(),
  tags: z.array(text),
  expectedStatus: z.enum([
    'passed',
    'failed',
    'timedOut',
    'skipped',
    'interrupted',
  ]),
  annotations: z.array(
    z.strictObject({ type: text, description: z.string().optional() }),
  ),
  isSetup: z.boolean(),
});
export const discoverySchema = z.strictObject({
  schemaVersion: z.literal(1),
  profile: text,
  projects: z.array(
    z.strictObject({
      name: z.string(),
      testDir: text,
      dependencies: z.array(text),
      repeatEach: z.number().int().positive(),
    }),
  ),
  tests: z.array(discoveryTestSchema),
  errors: z.array(text),
});
type Discovery = z.infer<typeof discoverySchema>;
type DiscoveredTest = z.infer<typeof discoveryTestSchema>;
export type { Discovery, DiscoveredTest };
