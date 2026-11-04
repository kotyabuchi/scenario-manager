import { z } from 'zod';

import { fixtureActorSchema, fixtureOwnerSchema } from './fixtureSchema';

export const LEGACY_STATE_FILE = 'e2e/.auth/user.json';

export const legacyProjectSchema = z.enum([
  'chromium',
  'mobile-chrome',
  'chromium-auth',
  'mobile-chrome-auth',
]);

export const legacyContextSchema = z.strictObject({
  schemaVersion: z.literal(1),
  owner: fixtureOwnerSchema.extend({
    project: legacyProjectSchema,
    workerIndex: z.literal(0),
    caseId: z.literal('legacy-suite'),
    retry: z.literal(0),
  }),
  ownerTag: z.string().regex(/^[a-f0-9]{64}$/),
  actor: fixtureActorSchema.options[1].extend({
    kind: z.literal('creator-only'),
  }),
  startedAt: z.iso.datetime(),
  stateHash: z.string().regex(/^[a-f0-9]{64}$/),
});

type LegacyProject = z.infer<typeof legacyProjectSchema>;
type LegacyContext = z.infer<typeof legacyContextSchema>;
export type { LegacyProject, LegacyContext };
