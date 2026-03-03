import { describe, expect, it } from 'vitest';

import {
  cancelApplicationSchema,
  cancelSessionSchema,
  characterSheetSchema,
  completeSessionSchema,
  participationRequestSchema,
  sessionLinkSchema,
  sessionMemoSchema,
  withdrawSchema,
} from '../schema';

describe('sessionMemoSchema', () => {
  it('空文字のメモはバリデーション成功する', () => {
    const result = sessionMemoSchema.safeParse({ memo: '' });
    expect(result.success).toBe(true);
  });

  it('通常のメモはバリデーション成功する', () => {
    const result = sessionMemoSchema.safeParse({
      memo: 'セッション準備メモ',
    });
    expect(result.success).toBe(true);
  });

  it('2000文字のメモはバリデーション成功する', () => {
    const result = sessionMemoSchema.safeParse({
      memo: 'あ'.repeat(2000),
    });
    expect(result.success).toBe(true);
  });

  it('2001文字以上のメモはバリデーション失敗する', () => {
    const result = sessionMemoSchema.safeParse({
      memo: 'あ'.repeat(2001),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'メモは2000文字以内で入力してください',
      );
    }
  });
});

describe('sessionLinkSchema', () => {
  it('有効なDISCORDリンクはバリデーション成功する', () => {
    const result = sessionLinkSchema.safeParse({
      linkType: 'DISCORD',
      url: 'https://discord.gg/example',
    });
    expect(result.success).toBe(true);
  });

  it('有効なCCFOLIAリンクはバリデーション成功する', () => {
    const result = sessionLinkSchema.safeParse({
      linkType: 'CCFOLIA',
      url: 'https://ccfolia.com/rooms/example',
      label: 'ココフォリア部屋',
    });
    expect(result.success).toBe(true);
  });

  it('linkIdありの更新リクエストはバリデーション成功する', () => {
    const result = sessionLinkSchema.safeParse({
      linkId: '01ABC123',
      linkType: 'OTHER',
      url: 'https://example.com',
      label: 'その他',
    });
    expect(result.success).toBe(true);
  });

  it('無効なURLはバリデーション失敗する', () => {
    const result = sessionLinkSchema.safeParse({
      linkType: 'DISCORD',
      url: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('http/httpsで始まらないURLはバリデーション失敗する', () => {
    const result = sessionLinkSchema.safeParse({
      linkType: 'DISCORD',
      url: 'ftp://example.com/file',
    });
    expect(result.success).toBe(false);
  });

  it('無効なlinkTypeはバリデーション失敗する', () => {
    const result = sessionLinkSchema.safeParse({
      linkType: 'INVALID',
      url: 'https://example.com',
    });
    expect(result.success).toBe(false);
  });

  it('101文字以上のラベルはバリデーション失敗する', () => {
    const result = sessionLinkSchema.safeParse({
      linkType: 'DISCORD',
      url: 'https://discord.gg/example',
      label: 'あ'.repeat(101),
    });
    expect(result.success).toBe(false);
  });
});

describe('characterSheetSchema', () => {
  it('有効なURLはバリデーション成功する', () => {
    const result = characterSheetSchema.safeParse({
      url: 'https://charasheet.vampire.jp/example',
    });
    expect(result.success).toBe(true);
  });

  it('空文字列はバリデーション成功する（削除用途）', () => {
    const result = characterSheetSchema.safeParse({
      url: '',
    });
    expect(result.success).toBe(true);
  });

  it('無効なURLはバリデーション失敗する', () => {
    const result = characterSheetSchema.safeParse({
      url: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('http/httpsで始まらないURLはバリデーション失敗する', () => {
    const result = characterSheetSchema.safeParse({
      url: 'ftp://example.com/sheet',
    });
    expect(result.success).toBe(false);
  });
});

describe('participationRequestSchema', () => {
  it('PLAYERタイプの申請はバリデーション成功する', () => {
    const result = participationRequestSchema.safeParse({
      participantType: 'PLAYER',
    });
    expect(result.success).toBe(true);
  });

  it('SPECTATORタイプの申請はバリデーション成功する', () => {
    const result = participationRequestSchema.safeParse({
      participantType: 'SPECTATOR',
    });
    expect(result.success).toBe(true);
  });

  it('メッセージ付きの申請はバリデーション成功する', () => {
    const result = participationRequestSchema.safeParse({
      participantType: 'PLAYER',
      applicationMessage: '初参加ですがよろしくお願いします！',
    });
    expect(result.success).toBe(true);
  });

  it('メッセージなし（空文字）の申請はバリデーション成功する', () => {
    const result = participationRequestSchema.safeParse({
      participantType: 'PLAYER',
      applicationMessage: '',
    });
    expect(result.success).toBe(true);
  });

  it('200文字のメッセージはバリデーション成功する', () => {
    const result = participationRequestSchema.safeParse({
      participantType: 'PLAYER',
      applicationMessage: 'あ'.repeat(200),
    });
    expect(result.success).toBe(true);
  });

  it('201文字以上のメッセージはバリデーション失敗する', () => {
    const result = participationRequestSchema.safeParse({
      participantType: 'PLAYER',
      applicationMessage: 'あ'.repeat(201),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        '一言メッセージは200文字以内で入力してください',
      );
    }
  });

  it('無効な参加タイプはバリデーション失敗する', () => {
    const result = participationRequestSchema.safeParse({
      participantType: 'KEEPER',
    });
    expect(result.success).toBe(false);
  });

  it('参加タイプなしはバリデーション失敗する', () => {
    const result = participationRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('cancelSessionSchema', () => {
  it('理由なしでバリデーション成功する', () => {
    const result = cancelSessionSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('理由付きでバリデーション成功する', () => {
    const result = cancelSessionSchema.safeParse({
      reason: 'GM都合によりキャンセルします',
    });
    expect(result.success).toBe(true);
  });

  it('500文字の理由はバリデーション成功する', () => {
    const result = cancelSessionSchema.safeParse({
      reason: 'あ'.repeat(500),
    });
    expect(result.success).toBe(true);
  });

  it('501文字以上の理由はバリデーション失敗する', () => {
    const result = cancelSessionSchema.safeParse({
      reason: 'あ'.repeat(501),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'キャンセル理由は500文字以内で入力してください',
      );
    }
  });
});

describe('withdrawSchema', () => {
  it('理由なしはバリデーション失敗する', () => {
    const result = withdrawSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('空文字の理由はバリデーション失敗する', () => {
    const result = withdrawSchema.safeParse({ reason: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        '辞退理由を入力してください',
      );
    }
  });

  it('空白のみの理由はバリデーション失敗する', () => {
    const result = withdrawSchema.safeParse({ reason: '   ' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        '辞退理由を入力してください',
      );
    }
  });

  it('理由付きでバリデーション成功する', () => {
    const result = withdrawSchema.safeParse({
      reason: '体調不良のため',
    });
    expect(result.success).toBe(true);
  });

  it('200文字の理由はバリデーション成功する', () => {
    const result = withdrawSchema.safeParse({
      reason: 'あ'.repeat(200),
    });
    expect(result.success).toBe(true);
  });

  it('201文字以上の理由はバリデーション失敗する', () => {
    const result = withdrawSchema.safeParse({
      reason: 'あ'.repeat(201),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        '辞退理由は200文字以内で入力してください',
      );
    }
  });
});

describe('cancelApplicationSchema', () => {
  it('空オブジェクトでバリデーション成功する', () => {
    const result = cancelApplicationSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('completeSessionSchema', () => {
  it('メモなしでバリデーション成功する', () => {
    const result = completeSessionSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('メモ付きでバリデーション成功する', () => {
    const result = completeSessionSchema.safeParse({
      note: 'セッション完了。次回は来月予定。',
    });
    expect(result.success).toBe(true);
  });

  it('1000文字のメモはバリデーション成功する', () => {
    const result = completeSessionSchema.safeParse({
      note: 'あ'.repeat(1000),
    });
    expect(result.success).toBe(true);
  });

  it('1001文字以上のメモはバリデーション失敗する', () => {
    const result = completeSessionSchema.safeParse({
      note: 'あ'.repeat(1001),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        '完了メモは1000文字以内で入力してください',
      );
    }
  });
});
