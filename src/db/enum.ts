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

export const FeedbackCategories = {
  BUG: {
    value: 'BUG',
    label: 'バグ報告',
  },
  FEATURE: {
    value: 'FEATURE',
    label: '機能要望',
  },
  UI_UX: {
    value: 'UI_UX',
    label: 'UI/UX改善',
  },
  OTHER: {
    value: 'OTHER',
    label: 'その他',
  },
} as const;

export const FeedbackStatuses = {
  NEW: {
    value: 'NEW',
    label: '新規',
  },
  TRIAGED: {
    value: 'TRIAGED',
    label: '検討中',
  },
  PLANNED: {
    value: 'PLANNED',
    label: '対応予定',
  },
  IN_PROGRESS: {
    value: 'IN_PROGRESS',
    label: '対応中',
  },
  DONE: {
    value: 'DONE',
    label: '完了',
  },
  WONT_FIX: {
    value: 'WONT_FIX',
    label: '対応しない',
  },
  DUPLICATE: {
    value: 'DUPLICATE',
    label: '重複',
  },
} as const;

export const FeedbackPriorities = {
  LOW: {
    value: 'LOW',
    label: '低',
  },
  MEDIUM: {
    value: 'MEDIUM',
    label: '中',
  },
  HIGH: {
    value: 'HIGH',
    label: '高',
  },
  CRITICAL: {
    value: 'CRITICAL',
    label: '緊急',
  },
} as const;

export const NotificationTypes = {
  FEEDBACK_STATUS_CHANGED: {
    value: 'FEEDBACK_STATUS_CHANGED',
    label: 'フィードバックのステータス変更',
  },
  FEEDBACK_COMMENT: {
    value: 'FEEDBACK_COMMENT',
    label: 'フィードバックへのコメント',
  },
  FEEDBACK_MERGED: {
    value: 'FEEDBACK_MERGED',
    label: 'フィードバックの統合',
  },
} as const;
