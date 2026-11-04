import { isNil } from 'ramda';
import { describe, expect, it } from 'vitest';

import {
  CONTAINER,
  containerList,
  fake,
  json,
  LABEL,
  NETWORK,
  networkList,
  PROJECT,
  rawContainer,
  rawNetwork,
  rawVolume,
  resources,
  SECRET,
  VOLUME,
  volumeList,
} from './environmentDockerFixtures';

const preflightLists = [
  ['container', 'ls', '--all', '--format', '{{.Names}}'],
  ['network', 'ls', '--format', '{{.Name}}'],
  ['volume', 'ls', '--format', '{{.Name}}'],
];

describe('createDockerDriver assertFreshProject', () => {
  it('labelで絞らず全3種の名前を読み、inspectや変更は実行しない', async () => {
    const fixture = fake(preflightLists.map((args) => ({ args, output: '' })));
    await expect(
      fixture.driver.assertFreshProject(PROJECT),
    ).resolves.toBeUndefined();
    fixture.verify();
  });

  it('別project・部分一致・旧container linkだけなら通し、応答値を返さない', async () => {
    const outputs = [
      `ordinary,webapp/db\nsupabase_db_${PROJECT}0\n`,
      `bridge\nsupabase_network_${PROJECT}_other\n`,
      'supabase_db_sm-e2e-fedcba543210\nordinary-volume',
    ];
    const fixture = fake(
      preflightLists.map((args, index) => ({
        args,
        output: outputs[index] ?? '',
      })),
    );
    expect(await fixture.driver.assertFreshProject(PROJECT)).toBeUndefined();
    fixture.verify();
  });

  it.each([
    {
      kind: 'container',
      index: 0,
      name: `supabase_db_${PROJECT}`,
      label: null,
    },
    {
      kind: 'container',
      index: 0,
      name: `supabase_auth_${PROJECT}`,
      label: 'other',
    },
    {
      kind: 'network',
      index: 1,
      name: `supabase_network_${PROJECT}`,
      label: null,
    },
    {
      kind: 'network',
      index: 1,
      name: `supabase_network_${PROJECT}`,
      label: 'other',
    },
    { kind: 'volume', index: 2, name: `supabase_db_${PROJECT}`, label: null },
    {
      kind: 'volume',
      index: 2,
      name: `supabase_storage_${PROJECT}`,
      label: 'other',
    },
    {
      kind: 'volume',
      index: 2,
      name: `future_service_${PROJECT}`,
      label: null,
    },
  ])('$kind の既存予約名をlabel=$labelでも拒否し再利用・削除しない', async ({
    kind,
    index,
    name,
    label,
  }) => {
    // label filterなしのlsはlabelの有無や内容に依存せず、同じNameを返す。
    const existing = {
      Name: name,
      Labels: isNil(label) ? null : { [LABEL]: label },
    };
    const fixture = fake(
      preflightLists.slice(0, index + 1).map((args, current) => ({
        args,
        output: current === index ? existing.Name : '',
      })),
    );
    await expect(fixture.driver.assertFreshProject(PROJECT)).rejects.toThrow(
      `Docker ${kind}に専用projectの既存resource`,
    );
    fixture.verify();
  });

  it('containerの複数名に予約名があれば取りこぼさない', async () => {
    const fixture = fake([
      {
        args: preflightLists[0] ?? [],
        output: `ordinary,supabase_db_${PROJECT}`,
      },
    ]);
    await expect(fixture.driver.assertFreshProject(PROJECT)).rejects.toThrow(
      '既存resource',
    );
    fixture.verify();
  });

  it.each([
    'scenario-manager',
    '',
    '--all',
    `sm-e2e-${SECRET}`,
  ])('専用でないproject %sを一覧取得前に拒否する', async (project) => {
    const fixture = fake([]);
    await expect(fixture.driver.assertFreshProject(project)).rejects.toThrow(
      '専用環境',
    );
    fixture.verify();
  });

  it.each([
    `invalid\t${SECRET}`,
    '{{.Names}}',
    'ordinary\n\nother',
    'a'.repeat(2 * 1024 * 1024 + 1),
    new Error(SECRET),
  ])('不正な応答・runner失敗は値やcauseを含めず拒否する', async (output) => {
    const fixture = fake([{ args: preflightLists[0] ?? [], output }]);
    const error = await fixture.driver
      .assertFreshProject(PROJECT)
      .catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(Error);
    expect(String(error)).toContain('事前検査');
    expect(String(error)).not.toContain(SECRET);
    expect(error).not.toHaveProperty('cause');
    fixture.verify();
  });

  it('network一覧取得失敗を空一覧として扱わない', async () => {
    const fixture = fake([
      { args: preflightLists[0] ?? [], output: '' },
      { args: preflightLists[1] ?? [], output: new Error(SECRET) },
    ]);
    await expect(fixture.driver.assertFreshProject(PROJECT)).rejects.toThrow(
      'Docker networkの名前による事前検査',
    );
    fixture.verify();
  });
});

describe('createDockerDriver observe', () => {
  it('CLIのproject labelで3種を絞り、対象だけをinspectして安全なDTOを返す', async () => {
    const fixture = fake([
      { args: containerList(), output: `${CONTAINER}\r\n` },
      {
        args: ['container', 'inspect', CONTAINER],
        output: json(rawContainer()),
      },
      { args: networkList(), output: NETWORK },
      { args: ['network', 'inspect', NETWORK], output: json(rawNetwork()) },
      { args: volumeList(), output: VOLUME },
      { args: ['volume', 'inspect', VOLUME], output: json(rawVolume()) },
    ]);
    const observed = await fixture.driver.observe(PROJECT);
    expect(observed).toEqual(resources());
    expect(JSON.stringify(observed)).not.toContain(SECRET);
    expect(observed.containers[0]).not.toHaveProperty('digest');
    fixture.verify();
  });

  it('空のprojectはinspectしない', async () => {
    const fixture = fake([
      { args: containerList(), output: '' },
      { args: networkList(), output: '' },
      { args: volumeList(), output: '' },
    ]);
    expect(await fixture.driver.observe(PROJECT)).toEqual({
      containers: [],
      networks: [],
      volumes: [],
    });
    fixture.verify();
  });

  it.each([
    'scenario-manager',
    '',
    '--all',
    `sm-e2e-${SECRET}`,
  ])('専用でないproject %sを実行前に拒否する', async (project) => {
    const fixture = fake([]);
    await expect(fixture.driver.observe(project)).rejects.toThrow('専用環境');
    fixture.verify();
  });

  it.each([
    '123456789abc',
    '--all',
    `${CONTAINER}\n${CONTAINER}`,
    SECRET,
  ])('一覧に不正なidentityがあればinspectしない: %s', async (output) => {
    const fixture = fake([{ args: containerList(), output }]);
    await expect(fixture.driver.observe(PROJECT)).rejects.toThrow('一覧取得');
    fixture.verify();
  });

  it.each([
    { title: '不正JSON', output: SECRET },
    {
      title: '複数件',
      output: JSON.stringify([rawContainer(), rawContainer()]),
    },
    { title: '空配列', output: '[]' },
    { title: 'ID差替え', output: json(rawContainer({ Id: '4'.repeat(64) })) },
    {
      title: '作成日時の欠落',
      output: json(rawContainer({ Created: undefined })),
    },
    {
      title: 'image digest欠落',
      output: json(rawContainer({ Image: 'postgres:17' })),
    },
    {
      title: '値へのsecret混入',
      output: json(rawContainer({ Name: `/${SECRET}\n` })),
    },
  ])('$titleを拒否し応答値をエラーへ含めない', async ({ output }) => {
    const fixture = fake([
      { args: containerList(), output: CONTAINER },
      { args: ['container', 'inspect', CONTAINER], output },
    ]);
    const error = await fixture.driver
      .observe(PROJECT)
      .catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(Error);
    expect(String(error)).not.toContain(SECRET);
    expect(error).not.toHaveProperty('cause');
    fixture.verify();
  });

  it('runner失敗のstderrを例外やcauseに残さない', async () => {
    const fixture = fake([
      { args: containerList(), output: new Error(SECRET) },
    ]);
    const error = await fixture.driver
      .observe(PROJECT)
      .catch((cause: unknown) => cause);
    expect(String(error)).toContain('一覧取得');
    expect(String(error)).not.toContain(SECRET);
    expect(error).not.toHaveProperty('cause');
    fixture.verify();
  });

  it('一覧とinspectの間でlabelが変わったら他projectの値を返さない', async () => {
    const fixture = fake([
      { args: containerList(), output: CONTAINER },
      {
        args: ['container', 'inspect', CONTAINER],
        output: json(
          rawContainer({
            Config: { Labels: { [LABEL]: SECRET } },
          }),
        ),
      },
    ]);
    const error = await fixture.driver
      .observe(PROJECT)
      .catch((cause: unknown) => cause);
    expect(String(error)).toContain('label');
    expect(String(error)).not.toContain(SECRET);
    fixture.verify();
  });

  it('消失したlabelはnullとして記録し所有証明を作らない', async () => {
    const fixture = fake([
      { args: containerList(), output: CONTAINER },
      {
        args: ['container', 'inspect', CONTAINER],
        output: json(rawContainer({ Config: { Labels: null } })),
      },
      { args: networkList(), output: '' },
      { args: volumeList(), output: '' },
    ]);
    expect(
      (await fixture.driver.observe(PROJECT)).containers[0]?.projectLabel,
    ).toBeNull();
    fixture.verify();
  });
});
