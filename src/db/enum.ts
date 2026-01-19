export function extractValues<T extends Record<string, { value: string }>>(
  enumObj: T,
): [T[keyof T]['value']] {
  const values = Object.values(enumObj).map((item) => item.value);
  return values as [T[keyof T]['value']];
}

export const Roles = {
  MODERATOR: {
    value: 'MODERATOR',
    label: 'モデレーター',
  },
  MEMBER: {
    value: 'MEMBER',
    label: 'メンバー',
  },
} as const;

export const SessionPhases = {
  RECRUITING: {
    value: 'RECRUITING',
    label: '募集中',
  },
  PREPARATION: {
    value: 'PREPARATION',
    label: '準備中',
  },
  IN_PROGRESS: {
    value: 'IN_PROGRESS',
    label: '進行中',
  },
  COMPLETED: {
    value: 'COMPLETED',
    label: '完了',
  },
  CANCELLED: {
    value: 'CANCELLED',
    label: 'キャンセル',
  },
} as const;

export const HandoutTypes = {
  NONE: {
    value: 'NONE',
    label: 'なし',
  },
  PUBLIC: {
    value: 'PUBLIC',
    label: '公開',
  },
  SECRET: {
    value: 'SECRET',
    label: '秘匿',
  },
} as const;

export const SchedulePhases = {
  ADJUSTING: {
    value: 'ADJUSTING',
    label: '調整中',
  },
  CONFIRMED: {
    value: 'CONFIRMED',
    label: '確定',
  },
} as const;

export const ParticipantTypes = {
  KEEPER: {
    value: 'KEEPER',
    label: 'キーパー',
  },
  PLAYER: {
    value: 'PLAYER',
    label: 'プレイヤー',
  },
  SPECTATOR: {
    value: 'SPECTATOR',
    label: '観戦者',
  },
} as const;

export const ParticipantStatuses = {
  PENDING: {
    value: 'PENDING',
    label: '未確定',
  },
  CONFIRMED: {
    value: 'CONFIRMED',
    label: '確定',
  },
} as const;
