import { describe, expect, it } from 'vitest';

import {
  CONTAINER,
  containerList,
  fake,
  json,
  LABEL,
  NETWORK,
  networkList,
  rawContainer,
  rawNetwork,
  rawVolume,
  resources,
  SECRET,
  VOLUME,
  volumeList,
} from './environmentDockerFixtures';

import type { EnvironmentResources } from './environmentSchema';

const onlyContainer = (): EnvironmentResources => ({
  ...resources(),
  networks: [],
  volumes: [],
});

describe('createDockerDriver remove', () => {
  it('各削除直前にinspectしcontainer・network・volumeの順でexact identityだけを削除する', async () => {
    const fixture = fake([
      {
        args: ['container', 'inspect', CONTAINER],
        output: json(rawContainer()),
      },
      { args: ['container', 'rm', '-f', CONTAINER], output: CONTAINER },
      { args: containerList(`id=${CONTAINER}`), output: '' },
      { args: ['network', 'inspect', NETWORK], output: json(rawNetwork()) },
      { args: ['network', 'rm', NETWORK], output: NETWORK },
      { args: networkList(`id=${NETWORK}`), output: '' },
      { args: ['volume', 'inspect', VOLUME], output: json(rawVolume()) },
      { args: ['volume', 'rm', VOLUME], output: VOLUME },
      { args: volumeList(`name=${VOLUME}`), output: '' },
    ]);
    expect(await fixture.driver.remove(resources())).toEqual([]);
    fixture.verify();
  });

  it.each([
    { Created: '2026-11-04T02:02:03Z' },
    { Name: '/replacement' },
    { Config: { Labels: { [LABEL]: 'sm-e2e-ffffffffffff' } } },
    { Config: { Labels: null } },
    { Image: `sha256:${'4'.repeat(64)}` },
  ])('直前観測の所有情報が変わったら削除しない: %j', async (changes) => {
    const fixture = fake([
      {
        args: ['container', 'inspect', CONTAINER],
        output: json(rawContainer(changes)),
      },
    ]);
    expect(await fixture.driver.remove(onlyContainer())).toMatchObject([
      { code: 'RESOURCE_IDENTITY_MISMATCH', subject: `container:${CONTAINER}` },
    ]);
    fixture.verify();
  });

  it('同名volumeが再作成されていても削除しない', async () => {
    const fixture = fake([
      {
        args: ['volume', 'inspect', VOLUME],
        output: json(rawVolume({ CreatedAt: '2026-11-04T02:02:03Z' })),
      },
    ]);
    expect(
      await fixture.driver.remove({
        containers: [],
        networks: [],
        volumes: resources().volumes,
      }),
    ).toMatchObject([
      { code: 'RESOURCE_IDENTITY_MISMATCH', subject: `volume:${VOLUME}` },
    ]);
    fixture.verify();
  });

  it.each([
    null,
    'scenario-manager',
    SECRET,
  ])('未証明label %sを実行前に拒否する', async (projectLabel) => {
    const fixture = fake([]);
    const input = onlyContainer();
    input.containers = input.containers.map((item) => ({
      ...item,
      projectLabel,
    }));
    const issues = await fixture.driver.remove(input);
    expect(issues).toMatchObject([{ code: 'UNPROVEN_OWNERSHIP' }]);
    expect(JSON.stringify(issues)).not.toContain(SECRET);
    fixture.verify();
  });

  it('候補のidentityが不正ならコマンドを発行しない', async () => {
    const fixture = fake([]);
    const input = onlyContainer();
    input.containers = input.containers.map((item) => ({
      ...item,
      id: '--all',
    }));
    expect(await fixture.driver.remove(input)).toMatchObject([
      { code: 'INVALID_RESOURCES' },
    ]);
    fixture.verify();
  });

  it('inspect失敗だけで消失とせず、一覧取得成功で不存在を再確認する', async () => {
    const fixture = fake([
      { args: ['container', 'inspect', CONTAINER], output: new Error(SECRET) },
      { args: containerList(`id=${CONTAINER}`), output: '' },
    ]);
    expect(await fixture.driver.remove(onlyContainer())).toEqual([]);
    fixture.verify();
  });

  it.each([
    { output: CONTAINER, code: 'INSPECTION_FAILED' },
    { output: new Error(SECRET), code: 'OBSERVATION_FAILED' },
  ])('inspect失敗後の不存在が証明できなければ$code', async ({
    output,
    code,
  }) => {
    const fixture = fake([
      { args: ['container', 'inspect', CONTAINER], output: new Error(SECRET) },
      { args: containerList(`id=${CONTAINER}`), output },
    ]);
    const issues = await fixture.driver.remove(onlyContainer());
    expect(issues).toMatchObject([{ code }]);
    expect(JSON.stringify(issues)).not.toContain(SECRET);
    fixture.verify();
  });

  it('部分一致する別volumeは対象の残留と混同しない', async () => {
    const fixture = fake([
      { args: ['volume', 'inspect', VOLUME], output: new Error(SECRET) },
      { args: volumeList(`name=${VOLUME}`), output: `${VOLUME}_other` },
    ]);
    expect(
      await fixture.driver.remove({
        containers: [],
        networks: [],
        volumes: resources().volumes,
      }),
    ).toEqual([]);
    fixture.verify();
  });

  it.each([
    { rm: CONTAINER, remaining: CONTAINER, code: 'RESOURCE_REMAINS' },
    { rm: new Error(SECRET), remaining: CONTAINER, code: 'REMOVE_FAILED' },
    { rm: CONTAINER, remaining: new Error(SECRET), code: 'REMOVAL_UNVERIFIED' },
  ])('削除後の残留と失敗を$codeとして返す', async ({ rm, remaining, code }) => {
    const fixture = fake([
      {
        args: ['container', 'inspect', CONTAINER],
        output: json(rawContainer()),
      },
      { args: ['container', 'rm', '-f', CONTAINER], output: rm },
      { args: containerList(`id=${CONTAINER}`), output: remaining },
    ]);
    const issues = await fixture.driver.remove(onlyContainer());
    expect(issues).toMatchObject([{ code }]);
    expect(JSON.stringify(issues)).not.toContain(SECRET);
    fixture.verify();
  });

  it('削除コマンド失敗でも別処理による消失を証明できれば成功とする', async () => {
    const fixture = fake([
      {
        args: ['container', 'inspect', CONTAINER],
        output: json(rawContainer()),
      },
      { args: ['container', 'rm', '-f', CONTAINER], output: new Error(SECRET) },
      { args: containerList(`id=${CONTAINER}`), output: '' },
    ]);
    expect(await fixture.driver.remove(onlyContainer())).toEqual([]);
    fixture.verify();
  });

  it('container削除失敗でも後続resourceの同一性を別々に検査する', async () => {
    const fixture = fake([
      {
        args: ['container', 'inspect', CONTAINER],
        output: json(rawContainer()),
      },
      { args: ['container', 'rm', '-f', CONTAINER], output: new Error(SECRET) },
      { args: containerList(`id=${CONTAINER}`), output: CONTAINER },
      { args: ['network', 'inspect', NETWORK], output: json(rawNetwork()) },
      { args: ['network', 'rm', NETWORK], output: NETWORK },
      { args: networkList(`id=${NETWORK}`), output: '' },
      { args: ['volume', 'inspect', VOLUME], output: json(rawVolume()) },
      { args: ['volume', 'rm', VOLUME], output: VOLUME },
      { args: volumeList(`name=${VOLUME}`), output: '' },
    ]);
    expect(await fixture.driver.remove(resources())).toMatchObject([
      { code: 'REMOVE_FAILED' },
    ]);
    fixture.verify();
  });
});
