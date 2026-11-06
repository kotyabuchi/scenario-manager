import { isNil } from 'ramda';
import { z } from 'zod';

import {
  environmentLeaseSchema,
  environmentResourcesSchema,
} from './environmentSchema';

import type {
  EnvironmentIssue,
  EnvironmentResources,
} from './environmentSchema';

// Supabase CLI v2.75.0 internal/utils/docker.go の DockerStart が全3種へ付与する。
const PROJECT_LABEL = 'com.supabase.cli.project';
const MAX_OUTPUT_BYTES = 2 * 1024 * 1024;
const labelsSchema = z
  .object({ [PROJECT_LABEL]: z.string().nullable().optional() })
  .nullish();
const containerInspectSchema = z.object({
  Id: z.string(),
  Name: z.string(),
  Created: z.string(),
  Image: z.string(),
  Config: z.object({ Labels: labelsSchema }),
});
const networkInspectSchema = z.object({
  Id: z.string(),
  Name: z.string(),
  Created: z.string(),
  Labels: labelsSchema,
});
const volumeInspectSchema = z.object({
  Name: z.string(),
  CreatedAt: z.string(),
  Labels: labelsSchema,
});
type ResourceKind = 'container' | 'network' | 'volume';
type Resource = EnvironmentResources[keyof EnvironmentResources][number];
type DockerRun = (args: string[]) => Promise<string>;

const identityOf = (resource: Resource) =>
  'id' in resource ? resource.id : resource.name;
const identitySchema = (kind: ResourceKind) =>
  kind === 'volume'
    ? environmentResourcesSchema.shape.volumes.element.shape.name
    : environmentResourcesSchema.shape.containers.element.shape.id;

const parseList = (kind: ResourceKind, output: string) => {
  if (Buffer.byteLength(output) > MAX_OUTPUT_BYTES)
    throw new Error('Docker一覧が上限を超えています。');
  const values = output.trim() === '' ? [] : output.trim().split(/\r?\n/);
  if (
    values.some((value) => !identitySchema(kind).safeParse(value).success) ||
    new Set(values).size !== values.length
  )
    throw new Error('Docker一覧のidentityが不正です。');
  return values.sort();
};

const listArgs = (kind: ResourceKind, filter: string) => [
  kind,
  'ls',
  ...(kind === 'container' ? ['--all'] : []),
  ...(kind !== 'volume' ? ['--no-trunc'] : []),
  '--filter',
  filter,
  '--format',
  kind === 'volume' ? '{{.Name}}' : '{{.ID}}',
];

const parseInspect = (kind: ResourceKind, output: string): Resource => {
  if (Buffer.byteLength(output) > MAX_OUTPUT_BYTES)
    throw new Error('Docker観測結果が上限を超えています。');
  const raw: unknown = JSON.parse(output);
  if (!Array.isArray(raw) || raw.length !== 1)
    throw new Error('Docker観測結果は1件である必要があります。');
  if (kind === 'container') {
    const item = containerInspectSchema.parse(raw[0]);
    return environmentResourcesSchema.shape.containers.element.parse({
      id: item.Id,
      name: item.Name.replace(/^\//, ''),
      createdAt: item.Created,
      imageId: item.Image,
      projectLabel: item.Config.Labels?.[PROJECT_LABEL] ?? null,
    });
  }
  if (kind === 'network') {
    const item = networkInspectSchema.parse(raw[0]);
    return environmentResourcesSchema.shape.networks.element.parse({
      id: item.Id,
      name: item.Name,
      createdAt: item.Created,
      projectLabel: item.Labels?.[PROJECT_LABEL] ?? null,
    });
  }
  const item = volumeInspectSchema.parse(raw[0]);
  return environmentResourcesSchema.shape.volumes.element.parse({
    name: item.Name,
    createdAt: item.CreatedAt,
    projectLabel: item.Labels?.[PROJECT_LABEL] ?? null,
  });
};

/** 接続先・子process環境を検査済みのrunnerから、所有resourceの観測と削除を行う。 */
// CLI v2.75.0 GetId/UpdateDockerIds は supabase_<service>_<projectId> を使う。
// https://github.com/supabase/cli/blob/v2.75.0/internal/utils/config.go#L53-L75
// network conflictを許容し、既存volumeも再利用するためlabelだけでは事前検査できない。
// https://github.com/supabase/cli/blob/v2.75.0/internal/utils/docker.go#L57-L70
const preflightNameArgs = (kind: ResourceKind) => [
  kind,
  'ls',
  ...(kind === 'container' ? ['--all'] : []),
  '--format',
  kind === 'container' ? '{{.Names}}' : '{{.Name}}',
];
const parseNames = (kind: ResourceKind, output: string) => {
  if (Buffer.byteLength(output) > MAX_OUTPUT_BYTES)
    throw new Error('Docker名前一覧が上限を超えています。');
  const lines = output.trim() === '' ? [] : output.trim().split(/\r?\n/);
  const names = lines.flatMap((line) =>
    kind === 'container' ? line.split(',').map((name) => name.trim()) : [line],
  );
  const schema = environmentResourcesSchema.shape.volumes.element.shape.name;
  // containerのNamesには旧linkのparent/alias表記も含まれる。
  if (
    names.some(
      (name) =>
        !(kind === 'container' ? name.split('/') : [name]).every(
          (part) => schema.safeParse(part).success,
        ),
    )
  )
    throw new Error('Docker名前一覧が不正です。');
  return names;
};
export const createDockerDriver = (run: DockerRun) => {
  const list = async (kind: ResourceKind, filter: string) => {
    try {
      return parseList(kind, await run(listArgs(kind, filter)));
    } catch {
      // runnerのstderrやDockerの応答値をError.causeにも残さない。
      throw new Error('Docker resourceの一覧取得に失敗しました。');
    }
  };
  const inspect = async (kind: ResourceKind, identity: string) => {
    try {
      const resource = parseInspect(
        kind,
        await run([kind, 'inspect', identity]),
      );
      if (identityOf(resource) !== identity)
        throw new Error('Docker観測identityが一致しません。');
      return resource;
    } catch {
      throw new Error('Docker resourceの観測に失敗しました。');
    }
  };
  const exists = async (kind: ResourceKind, identity: string) => {
    const filter = `${kind === 'volume' ? 'name' : 'id'}=${identity}`;
    // Dockerのname filterは部分一致するため、戻り値を完全一致でも照合する。
    return (await list(kind, filter)).includes(identity);
  };
  const observeKind = async (kind: ResourceKind, projectId: string) => {
    const identities = await list(kind, `label=${PROJECT_LABEL}=${projectId}`);
    const resources: Resource[] = [];
    for (const identity of identities) {
      const resource = await inspect(kind, identity);
      if (!isNil(resource.projectLabel) && resource.projectLabel !== projectId)
        throw new Error('Docker resourceのproject labelが一致しません。');
      resources.push(resource);
    }
    return resources;
  };

  return {
    /**
     * 全resourceの名前を読み、labelなし・別labelも含む専用project名の再利用を拒否する。
     * 未使用serviceの漏れも防ぐため _<projectId> の完全suffixを保守的に拒否する。
     * 観測後の競合を防ぐ原子的なDocker予約ではない。再利用・削除は一切行わない。
     */
    assertFreshProject: async (projectId: string): Promise<void> => {
      if (!environmentLeaseSchema.shape.projectId.safeParse(projectId).success)
        throw new Error('専用環境のproject IDが必要です。');
      for (const kind of ['container', 'network', 'volume'] as const) {
        let names: string[];
        try {
          names = parseNames(kind, await run(preflightNameArgs(kind)));
        } catch {
          // 他projectの名前やrunnerのstderrもエラーへ転記しない。
          throw new Error(`Docker ${kind}の名前による事前検査に失敗しました。`);
        }
        if (names.some((name) => name.endsWith(`_${projectId}`)))
          throw new Error(
            `Docker ${kind}に専用projectの既存resourceがあります。再利用・削除はしません: ${projectId}`,
          );
      }
    },
    /** labelで絞ったidentityだけをinspectし、Env・他label・応答全文は返さない。 */
    observe: async (projectId: string): Promise<EnvironmentResources> => {
      if (!environmentLeaseSchema.shape.projectId.safeParse(projectId).success)
        throw new Error('専用環境のproject IDが必要です。');
      return environmentResourcesSchema.parse({
        containers: await observeKind('container', projectId),
        networks: await observeKind('network', projectId),
        volumes: await observeKind('volume', projectId),
      });
    },
    /** pure cleanup計画の候補を直前に再検査し、exact identityだけを順番に削除する。 */
    remove: async (
      input: EnvironmentResources,
    ): Promise<EnvironmentIssue[]> => {
      const parsed = environmentResourcesSchema.safeParse(input);
      if (!parsed.success)
        return [
          {
            code: 'INVALID_RESOURCES',
            subject: 'docker',
            message: '削除候補のresource記録が不正です。',
          },
        ];
      const issues: EnvironmentIssue[] = [];
      const groups = [
        ['container', parsed.data.containers],
        ['network', parsed.data.networks],
        ['volume', parsed.data.volumes],
      ] as const;
      for (const [kind, resources] of groups) {
        for (const original of resources) {
          const identity = identityOf(original);
          const issue = (code: string, message: string) =>
            issues.push({ code, subject: `${kind}:${identity}`, message });
          if (
            !environmentLeaseSchema.shape.projectId.safeParse(
              original.projectLabel,
            ).success
          ) {
            issue(
              'UNPROVEN_OWNERSHIP',
              '専用project labelのないresourceは削除できません。',
            );
            continue;
          }
          let current: Resource;
          try {
            current = await inspect(kind, identity);
          } catch {
            try {
              if (await exists(kind, identity))
                issue(
                  'INSPECTION_FAILED',
                  '削除直前のresource観測に失敗しました。',
                );
              // 一覧の取得成功と完全一致の不在で証明できた消失だけを成功扱いにする。
            } catch {
              issue(
                'OBSERVATION_FAILED',
                'resourceの不存在を確認できませんでした。',
              );
            }
            continue;
          }
          if (
            current.name !== original.name ||
            current.createdAt !== original.createdAt ||
            current.projectLabel !== original.projectLabel ||
            ('imageId' in original &&
              (!('imageId' in current) || current.imageId !== original.imageId))
          ) {
            issue(
              'RESOURCE_IDENTITY_MISMATCH',
              '削除直前にresourceの所有情報が変わりました。',
            );
            continue;
          }
          let didRemoveFail = false;
          try {
            await run([
              kind,
              'rm',
              ...(kind === 'container' ? ['-f'] : []),
              identity,
            ]);
          } catch {
            didRemoveFail = true;
          }
          try {
            if (await exists(kind, identity))
              issue(
                didRemoveFail ? 'REMOVE_FAILED' : 'RESOURCE_REMAINS',
                '削除処理の後もresourceが残っています。',
              );
          } catch {
            issue(
              'REMOVAL_UNVERIFIED',
              '削除後のresource不存在を確認できませんでした。',
            );
          }
        }
      }
      return issues;
    },
  };
};
