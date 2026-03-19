import { isNil } from 'ramda';

type SeatWarningInput = {
  participantCount: number;
  maxPlayer: number | null;
};

type SeatWarningResult = {
  remainingSeats: number;
  label: string;
};

/**
 * 残り席警告の判定
 *
 * 残り人数が最大人数の3割以下になった場合に警告情報を返す。
 * - 例: 最大4人で3人参加 → 残り1席（25% ≤ 30%） → 警告表示
 * - 例: 最大4人で2人参加 → 残り2席（50%） → null
 */
export const getSeatWarning = (
  input: SeatWarningInput,
): SeatWarningResult | null => {
  const { participantCount, maxPlayer } = input;

  if (isNil(maxPlayer) || maxPlayer === 0) {
    return null;
  }

  const remainingSeats = maxPlayer - participantCount;
  const remainingRatio = remainingSeats / maxPlayer;

  if (remainingRatio > 0.3) {
    return null;
  }

  return {
    remainingSeats,
    label: `残り${remainingSeats}席`,
  };
};
