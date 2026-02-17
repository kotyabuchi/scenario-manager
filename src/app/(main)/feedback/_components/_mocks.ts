import type {
  CommentWithUser,
  FeedbackDetail,
  FeedbackWithUser,
} from '../interface';

// ── 共通ベースデータ ─────────────────────────

const baseUser = {
  userId: 'user-1',
  nickname: 'たろう',
  image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=taro',
};

const baseFeedback = {
  adminNote: null,
  browserInfo: null,
  pageUrl: null,
  priority: null,
  resolvedAt: null,
  screenshotUrl: null,
  mergedIntoId: null,
  updatedAt: '2026-01-15T10:00:00Z',
} as const;

// ── FeedbackWithUser モック ──────────────────

/** 機能要望・投票済み・多数投票 */
export const mockFeatureFeedback: FeedbackWithUser = {
  ...baseFeedback,
  feedbackId: '01JFEEDBACK0001',
  title: 'ダークモードに対応してほしい',
  description:
    '夜間に使用する際、画面が明るすぎて目が疲れます。ダークモードがあると嬉しいです。設定画面からトグルで切り替えられると理想的です。',
  category: 'FEATURE',
  status: 'PLANNED',
  voteCount: 42,
  commentCount: 8,
  userId: 'user-1',
  createdAt: '2026-01-10T09:00:00Z',
  hasVoted: true,
  user: baseUser,
};

/** バグ報告・未投票 */
export const mockBugFeedback: FeedbackWithUser = {
  ...baseFeedback,
  feedbackId: '01JFEEDBACK0002',
  title: 'シナリオ検索でタグが正しくフィルタされない',
  description:
    '複数タグを選択した場合、AND検索ではなくOR検索になっているようです。',
  category: 'BUG',
  status: 'IN_PROGRESS',
  voteCount: 15,
  commentCount: 3,
  userId: 'user-2',
  createdAt: '2026-01-12T14:30:00Z',
  hasVoted: false,
  user: {
    userId: 'user-2',
    nickname: 'はなこ',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hanako',
  },
};

/** UI/UX改善・アバターなし */
export const mockUIFeedback: FeedbackWithUser = {
  ...baseFeedback,
  feedbackId: '01JFEEDBACK0003',
  title: 'セッション一覧のカードデザインを改善してほしい',
  description:
    '現在のカードデザインは情報量が多く、一覧性が悪いと感じます。もう少しコンパクトにまとめられないでしょうか。',
  category: 'UI_UX',
  status: 'NEW',
  voteCount: 7,
  commentCount: 1,
  userId: 'user-3',
  createdAt: '2026-01-14T20:15:00Z',
  hasVoted: false,
  user: {
    userId: 'user-3',
    nickname: 'じろう',
    image: null,
  },
};

/** 完了済み・高投票数 */
export const mockDoneFeedback: FeedbackWithUser = {
  ...baseFeedback,
  feedbackId: '01JFEEDBACK0005',
  title: 'レビュー機能にネタバレ警告を追加',
  description:
    'シナリオのレビューにネタバレが含まれる場合、デフォルトで非表示にして警告を表示する仕組みが欲しいです。',
  category: 'FEATURE',
  status: 'DONE',
  voteCount: 55,
  commentCount: 12,
  userId: 'user-5',
  createdAt: '2025-12-20T16:45:00Z',
  hasVoted: true,
  user: {
    userId: 'user-5',
    nickname: 'ゆうき',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yuki',
  },
};

export const mockFeedbackList: FeedbackWithUser[] = [
  mockFeatureFeedback,
  mockBugFeedback,
  mockUIFeedback,
  {
    ...baseFeedback,
    feedbackId: '01JFEEDBACK0004',
    title: 'セッション募集の通知機能',
    description:
      '夜間に使用する際、画面が明るすぎて目が疲れます。ダークモードがあると嬉しいです。設定画面からトグルで切り替えられると理想的です。',
    category: 'FEATURE',
    status: 'PLANNED',
    voteCount: 42,
    commentCount: 8,
    userId: 'user-1',
    createdAt: '2026-01-10T09:00:00Z',
    hasVoted: true,
    user: baseUser,
  },
  {
    ...baseFeedback,
    feedbackId: '01JFEEDBACK0006',
    title: 'プロフィール画面でアバター変更ができない',
    description:
      'プロフィール編集画面でアバター画像を変更しても反映されません。',
    category: 'BUG',
    status: 'IN_PROGRESS',
    voteCount: 11,
    commentCount: 2,
    userId: 'user-6',
    createdAt: '2026-01-11T08:00:00Z',
    hasVoted: false,
    user: {
      userId: 'user-6',
      nickname: 'みく',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=miku',
    },
  },
  {
    ...baseFeedback,
    feedbackId: '01JFEEDBACK0007',
    title: 'セッション日程調整のUIが分かりにくい',
    description: '日程調整の操作が直感的でなく、初見では使い方が分かりません。',
    category: 'UI_UX',
    status: 'NEW',
    voteCount: 9,
    commentCount: 1,
    userId: 'user-7',
    createdAt: '2026-01-13T17:00:00Z',
    hasVoted: false,
    user: {
      userId: 'user-7',
      nickname: 'けんた',
      image: null,
    },
  },
  {
    ...baseFeedback,
    feedbackId: '01JFEEDBACK0008',
    title: 'セッション募集の通知機能',
    description:
      'フォローしているKPが新しいセッションを募集した際に通知を受け取りたいです。',
    category: 'FEATURE',
    status: 'TRIAGED',
    voteCount: 28,
    commentCount: 5,
    userId: 'user-4',
    createdAt: '2026-01-08T11:00:00Z',
    hasVoted: true,
    user: {
      userId: 'user-4',
      nickname: 'さくら',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sakura',
    },
  },
  mockDoneFeedback,
];

// ── CommentWithUser モック ───────────────────

export const mockComments: CommentWithUser[] = [
  {
    commentId: 'comment-1',
    content:
      'この機能、ぜひ実装してほしいです！夜にシナリオを読むことが多いので、ダークモードがあると助かります。',
    feedbackId: '01JFEEDBACK0001',
    userId: 'user-2',
    isOfficial: false,
    createdAt: '2026-01-11T10:00:00Z',
    updatedAt: '2026-01-11T10:00:00Z',
    user: {
      userId: 'user-2',
      nickname: 'はなこ',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hanako',
    },
  },
  {
    commentId: 'comment-2',
    content:
      'ご要望ありがとうございます！ダークモードは次のメジャーアップデートで対応予定です。具体的なスケジュールが決まり次第、こちらでお知らせします。',
    feedbackId: '01JFEEDBACK0001',
    userId: 'user-admin',
    isOfficial: true,
    createdAt: '2026-01-12T09:00:00Z',
    updatedAt: '2026-01-12T09:00:00Z',
    user: {
      userId: 'user-admin',
      nickname: '管理者',
      image: null,
    },
  },
  {
    commentId: 'comment-3',
    content: '賛成です！システム設定に連動するオプションもあると嬉しいですね。',
    feedbackId: '01JFEEDBACK0001',
    userId: 'user-3',
    isOfficial: false,
    createdAt: '2026-01-13T15:30:00Z',
    updatedAt: '2026-01-13T15:30:00Z',
    user: {
      userId: 'user-3',
      nickname: 'じろう',
      image: null,
    },
  },
];

// ── FeedbackDetail モック ────────────────────

export const mockFeedbackDetail: FeedbackDetail = {
  ...baseFeedback,
  feedbackId: '01JFEEDBACK0001',
  title: 'ダークモードに対応してほしい',
  description:
    '夜間に使用する際、画面が明るすぎて目が疲れます。ダークモードがあると嬉しいです。\n\n設定画面からトグルで切り替えられると理想的です。また、OSのダークモード設定に連動するオプションもあると便利だと思います。\n\n参考: 他のTRPGツールではすでに対応しているものが多いです。',
  category: 'FEATURE',
  status: 'PLANNED',
  voteCount: 42,
  commentCount: 3,
  userId: 'user-1',
  createdAt: '2026-01-10T09:00:00Z',
  hasVoted: true,
  mergedCount: 2,
  user: baseUser,
  comments: mockComments,
};

/** ステータスが DUPLICATE + マージ先ありの詳細 */
export const mockMergedFeedbackDetail: FeedbackDetail = {
  ...baseFeedback,
  feedbackId: '01JFEEDBACK0006',
  title: 'ナイトモード対応のお願い',
  description: 'ダークテーマがほしいです。',
  category: 'FEATURE',
  status: 'DUPLICATE',
  voteCount: 3,
  commentCount: 0,
  userId: 'user-5',
  createdAt: '2026-01-14T12:00:00Z',
  hasVoted: false,
  mergedCount: 0,
  mergedIntoId: '01JFEEDBACK0001',
  user: {
    userId: 'user-5',
    nickname: 'ゆうき',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yuki',
  },
  comments: [],
};
