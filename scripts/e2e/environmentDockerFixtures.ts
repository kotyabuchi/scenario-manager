import { isNil } from 'ramda';
import { expect, vi } from 'vitest';

import { createDockerDriver } from './environmentDocker';

import type { EnvironmentResources } from './environmentSchema';

export const PROJECT = 'sm-e2e-012345abcdef';
export const LABEL = 'com.supabase.cli.project';
export const CONTAINER = '1'.repeat(64);
export const NETWORK = '2'.repeat(64);
const IMAGE = `sha256:${'3'.repeat(64)}`;
export const VOLUME = `supabase_db_${PROJECT}`;
const CREATED = '2026-11-04T01:02:03.123456789Z';
export const SECRET = 'test-secret-that-must-not-appear';
export const resources = (): EnvironmentResources => ({
  containers: [
    {
      id: CONTAINER,
      name: VOLUME,
      projectLabel: PROJECT,
      createdAt: CREATED,
      imageId: IMAGE,
    },
  ],
  networks: [
    {
      id: NETWORK,
      name: `supabase_network_${PROJECT}`,
      projectLabel: PROJECT,
      createdAt: CREATED,
    },
  ],
  volumes: [{ name: VOLUME, projectLabel: PROJECT, createdAt: CREATED }],
});
export const rawContainer = (changes: Record<string, unknown> = {}) => ({
  Id: CONTAINER,
  Name: `/${VOLUME}`,
  Created: CREATED,
  Image: IMAGE,
  Config: {
    Labels: { [LABEL]: PROJECT, other: SECRET },
    Env: [`PASSWORD=${SECRET}`],
  },
  Mounts: [{ Source: SECRET }],
  ...changes,
});
export const rawNetwork = (changes: Record<string, unknown> = {}) => ({
  Id: NETWORK,
  Name: `supabase_network_${PROJECT}`,
  Created: CREATED,
  Labels: { [LABEL]: PROJECT, other: SECRET },
  ...changes,
});
export const rawVolume = (changes: Record<string, unknown> = {}) => ({
  Name: VOLUME,
  CreatedAt: CREATED,
  Labels: { [LABEL]: PROJECT, other: SECRET },
  Options: { password: SECRET },
  ...changes,
});
export const json = (value: unknown) => JSON.stringify([value]);
export const containerList = (filter = `label=${LABEL}=${PROJECT}`) => [
  'container',
  'ls',
  '--all',
  '--no-trunc',
  '--filter',
  filter,
  '--format',
  '{{.ID}}',
];
export const networkList = (filter = `label=${LABEL}=${PROJECT}`) => [
  'network',
  'ls',
  '--no-trunc',
  '--filter',
  filter,
  '--format',
  '{{.ID}}',
];
export const volumeList = (filter = `label=${LABEL}=${PROJECT}`) => [
  'volume',
  'ls',
  '--filter',
  filter,
  '--format',
  '{{.Name}}',
];
type Step = { args: string[]; output: string | Error };
export const fake = (steps: Step[]) => {
  let next = 0;
  const run = vi.fn(async (_args: string[]) => {
    const step = steps[next++];
    if (isNil(step)) throw new Error('想定外のDocker呼び出し');
    if (step.output instanceof Error) throw step.output;
    return step.output;
  });
  return {
    driver: createDockerDriver(run),
    verify: () =>
      expect(run.mock.calls).toEqual(steps.map((step) => [step.args])),
  };
};
