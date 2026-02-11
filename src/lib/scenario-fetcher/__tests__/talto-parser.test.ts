import { describe, expect, it } from 'vitest';

import { extractTaltoProjectId, parseTaltoFromApi } from '../talto-parser';

describe('extractTaltoProjectId', () => {
  it('正規のURLからプロジェクトIDを抽出する', () => {
    const id = extractTaltoProjectId(
      'https://talto.cc/projects/oMjPyDsyzMEvAdQ2CpkZe',
    );
    expect(id).toBe('oMjPyDsyzMEvAdQ2CpkZe');
  });

  it('末尾にスラッシュがあっても抽出できる', () => {
    const id = extractTaltoProjectId(
      'https://talto.cc/projects/oMjPyDsyzMEvAdQ2CpkZe/',
    );
    expect(id).toBe('oMjPyDsyzMEvAdQ2CpkZe');
  });

  it('不正なURLではnullを返す', () => {
    expect(extractTaltoProjectId('https://talto.cc/')).toBeNull();
    expect(
      extractTaltoProjectId('https://example.com/projects/abc'),
    ).toBeNull();
  });
});

describe('parseTaltoFromApi', () => {
  const sampleApiResponse = {
    project: {
      name: '錆びた祈りの残響',
      author: 'エゴ',
      players_min: 3,
      players_max: 4,
      playing_hour_min: null,
      playing_hour_max: 5,
    },
  };

  it('タイトルと作者名を high confidence で返す', () => {
    const result = parseTaltoFromApi(
      sampleApiResponse,
      'https://talto.cc/projects/abc123',
    );

    expect(result.title).toEqual({
      value: '錆びた祈りの残響',
      confidence: 'high',
    });
    expect(result.author).toEqual({
      value: 'エゴ',
      confidence: 'high',
    });
  });

  it('プレイ人数を high confidence で返す', () => {
    const result = parseTaltoFromApi(
      sampleApiResponse,
      'https://talto.cc/projects/abc123',
    );

    expect(result.minPlayer).toEqual({ value: 3, confidence: 'high' });
    expect(result.maxPlayer).toEqual({ value: 4, confidence: 'high' });
  });

  it('プレイ時間を時間→秒に変換して返す', () => {
    const result = parseTaltoFromApi(
      sampleApiResponse,
      'https://talto.cc/projects/abc123',
    );

    // playing_hour_min が null なので minPlaytime も null
    expect(result.minPlaytime).toBeNull();
    // playing_hour_max = 5 → 5 * 3600 = 18000秒
    expect(result.maxPlaytime).toEqual({ value: 18000, confidence: 'high' });
  });

  it('sourceType と sourceUrl が正しく設定される', () => {
    const result = parseTaltoFromApi(
      sampleApiResponse,
      'https://talto.cc/projects/abc123',
    );

    expect(result.sourceType).toBe('talto');
    expect(result.sourceUrl).toBe('https://talto.cc/projects/abc123');
  });

  it('プレイ人数が null の場合は null を返す', () => {
    const result = parseTaltoFromApi(
      {
        project: {
          ...sampleApiResponse.project,
          players_min: null,
          players_max: null,
        },
      },
      'https://talto.cc/projects/abc123',
    );

    expect(result.minPlayer).toBeNull();
    expect(result.maxPlayer).toBeNull();
  });
});
