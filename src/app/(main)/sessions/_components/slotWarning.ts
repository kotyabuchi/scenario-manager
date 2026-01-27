type SlotWarningInput = {
  participantCount: number;
  maxPlayer: number | null;
};

type SlotWarningResult = {
  remainingSlots: number;
  label: string;
};

/**
 * 残り枠警告の判定
 *
 * 残り人数が最大人数の3割以下になった場合に警告情報を返す。
 * - 例: 最大4人で3人参加 → 残り1枠（25% ≤ 30%） → 警告表示
 * - 例: 最大4人で2人参加 → 残り2枠（50%） → null
 */
export const getSlotWarning = (
  input: SlotWarningInput,
): SlotWarningResult | null => {
  const { participantCount, maxPlayer } = input;

  if (maxPlayer === null || maxPlayer === 0) {
    return null;
  }

  const remainingSlots = maxPlayer - participantCount;
  const remainingRatio = remainingSlots / maxPlayer;

  if (remainingRatio > 0.3) {
    return null;
  }

  return {
    remainingSlots,
    label: `残り${remainingSlots}枠`,
  };
};
