import { describe, expect, it } from 'vitest';

import { getSeatWarning } from '../_components/seatWarning';

/**
 * 残り席警告の表示判定テスト
 * 要件: requirements-session-list.md セクション2.4 残り席警告
 *
 * 表示条件: 残り人数が最大人数の3割以下になった場合、赤色の「残りN席」バッジを表示
 * - 例: 最大4人で3人参加済み → 残り1席（25%、3割以下） → 警告表示
 * - 例: 最大4人で2人参加済み → 残り2席（50%） → 通常表示
 *
 * 対応テストケース:
 * - T-SW-001: 残り人数が30%以下で警告を返す
 * - T-SW-002: 残り人数が30%超で警告なしを返す
 * - T-SW-003: maxPlayerがnullの場合は警告なし
 * - T-SW-004: 参加者0人の場合は通常表示
 */
describe('getSeatWarning', () => {
  // T-SW-001: 残り人数が30%以下で警告を返す
  it('残り人数が30%以下で警告を返す', () => {
    // 最大4人で3人参加 → 残り1席 = 25% ≤ 30%
    const result = getSeatWarning({ participantCount: 3, maxPlayer: 4 });

    expect(result).not.toBeNull();
    expect(result?.remainingSeats).toBe(1);
    expect(result?.label).toBe('残り1席');
  });

  // 最大10人で8人参加 → 残り2席 = 20% ≤ 30%
  it('最大10人で8人参加時に警告を返す', () => {
    const result = getSeatWarning({ participantCount: 8, maxPlayer: 10 });

    expect(result).not.toBeNull();
    expect(result?.remainingSeats).toBe(2);
    expect(result?.label).toBe('残り2席');
  });

  // ちょうど30%のケース: 最大10人で7人参加 → 残り3席 = 30%
  it('ちょうど30%でも警告を返す', () => {
    const result = getSeatWarning({ participantCount: 7, maxPlayer: 10 });

    expect(result).not.toBeNull();
    expect(result?.remainingSeats).toBe(3);
  });

  // T-SW-002: 残り人数が30%超で警告なしを返す
  it('残り人数が30%超で警告なしを返す', () => {
    // 最大4人で2人参加 → 残り2席 = 50% > 30%
    const result = getSeatWarning({ participantCount: 2, maxPlayer: 4 });

    expect(result).toBeNull();
  });

  // 最大10人で6人参加 → 残り4席 = 40% > 30%
  it('残り40%で警告なしを返す', () => {
    const result = getSeatWarning({ participantCount: 6, maxPlayer: 10 });

    expect(result).toBeNull();
  });

  // T-SW-003: maxPlayerがnullの場合は警告なし
  it('maxPlayerがnullの場合は警告なしを返す', () => {
    const result = getSeatWarning({ participantCount: 3, maxPlayer: null });

    expect(result).toBeNull();
  });

  // T-SW-004: 参加者0人の場合は通常表示
  it('参加者0人の場合は警告なしを返す', () => {
    const result = getSeatWarning({ participantCount: 0, maxPlayer: 4 });

    expect(result).toBeNull();
  });

  // 満員の場合（残り0席）は警告を返す
  it('満員の場合は警告を返す', () => {
    const result = getSeatWarning({ participantCount: 4, maxPlayer: 4 });

    expect(result).not.toBeNull();
    expect(result?.remainingSeats).toBe(0);
    expect(result?.label).toBe('残り0席');
  });

  // maxPlayerが0の場合は警告なし
  it('maxPlayerが0の場合は警告なしを返す', () => {
    const result = getSeatWarning({ participantCount: 0, maxPlayer: 0 });

    expect(result).toBeNull();
  });
});
