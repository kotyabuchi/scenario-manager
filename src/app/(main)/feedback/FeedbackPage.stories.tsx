import { CaretDown, Plus } from '@phosphor-icons/react/ssr';

import { mockFeedbackList } from './_components/_mocks';
import { FeedbackList } from './_components/FeedbackList';
import * as contentStyles from './_components/styles';
import * as pageStyles from './styles';

import { PageHeader } from '@/components/blocks/PageHeader/PageHeader';
import { Button } from '@/components/elements/button/button';
import { Checkbox } from '@/components/elements/checkbox';
import { Input } from '@/components/elements/input';
import { FeedbackCategories } from '@/db/enum';

import type { Meta, StoryObj } from '@storybook/react';

const categoryOptions = [
  { value: '', label: 'すべて' },
  ...Object.values(FeedbackCategories).map((c) => ({
    value: c.value,
    label: c.label,
  })),
];

/**
 * フィードバック一覧ページの全体レイアウト。
 * FeedbackContentはnuqs/fetch依存のため、静的なレイアウト合成で表示。
 */
const FeedbackPageLayout = ({
  feedbacks,
  activeCategory,
  totalCount,
}: {
  feedbacks: typeof mockFeedbackList;
  activeCategory: string;
  totalCount: number;
}) => (
  <>
    <PageHeader
      backHref={'/home' as '/home'}
      title="フィードバック"
      actions={
        <Button status="primary" size="sm">
          <Plus size={16} weight="bold" />
          新規投稿
        </Button>
      }
    />
    <div className={pageStyles.pageContainer}>
      <div className={contentStyles.contentHeader}>
        <div className={contentStyles.categoryChips}>
          {categoryOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={contentStyles.categoryChip({
                isActive: activeCategory === opt.value,
              })}
            >
              {opt.label}
            </button>
          ))}
          <div className={contentStyles.chipDivider} />
          <button
            type="button"
            className={contentStyles.categoryChip({ isActive: false })}
          >
            自分の投稿
          </button>
        </div>

        <Input
          type="search"
          placeholder="フィードバックを検索..."
          aria-label="フィードバックを検索"
        />

        <div className={contentStyles.filterControlRow}>
          <Checkbox checked={false}>見送り・統合済みも表示</Checkbox>
          <div className={contentStyles.sortSelectWrapper}>
            <Button variant="ghost" size="sm">
              投票数順
              <CaretDown size={14} />
            </Button>
          </div>
        </div>
      </div>

      <div className={contentStyles.resultsArea}>
        <div className={contentStyles.resultCount}>
          {totalCount}件のフィードバック
        </div>

        <FeedbackList feedbacks={feedbacks} hasFilters={false} />

        {feedbacks.length < totalCount && (
          <div className={contentStyles.loadMoreContainer}>
            <Button variant="outline" className={contentStyles.loadMoreButton}>
              もっと見る
              <CaretDown size={18} className={contentStyles.loadMoreIcon} />
            </Button>
          </div>
        )}
      </div>
    </div>
  </>
);

const meta = {
  title: 'Feedback/Page/FeedbackListPage',
  component: FeedbackPageLayout,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
} satisfies Meta<typeof FeedbackPageLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 通常表示（複数カード + もっと見る） */
export const Default: Story = {
  args: {
    feedbacks: mockFeedbackList,
    activeCategory: '',
    totalCount: 24,
  },
};

/** カテゴリフィルタ: バグ */
export const FilteredByBug: Story = {
  args: {
    feedbacks: mockFeedbackList.filter((f) => f.category === 'BUG'),
    activeCategory: 'BUG',
    totalCount: 2,
  },
};

/** 結果なし */
export const Empty: Story = {
  args: {
    feedbacks: [],
    activeCategory: '',
    totalCount: 0,
  },
};

/** カード少数（もっと見るなし） */
export const FewItems: Story = {
  args: {
    feedbacks: mockFeedbackList.slice(0, 3),
    activeCategory: '',
    totalCount: 3,
  },
};
