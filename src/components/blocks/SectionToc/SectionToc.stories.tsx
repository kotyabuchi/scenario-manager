import { SectionToc, type TocSection } from './SectionToc';

import type { Meta, StoryObj } from '@storybook/react';

const sections: TocSection[] = [
  { id: 'overview', label: '概要' },
  { id: 'info', label: 'シナリオ情報' },
  { id: 'ho', label: 'HO情報' },
  { id: 'sessions', label: '関連セッション' },
  { id: 'videos', label: 'プレイ動画' },
  { id: 'comments', label: 'コメント' },
  { id: 'links', label: '外部リンク・資料' },
];

const MockSections = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
    {sections.map((s) => (
      <section
        key={s.id}
        id={s.id}
        style={{
          minHeight: 360,
          background: '#fff',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{s.label}</h2>
        <p style={{ color: '#777', marginTop: 8 }}>
          {s.label}{' '}
          のダミーコンテンツ。スクロールすると目次の現在地が追従します。
        </p>
      </section>
    ))}
  </div>
);

const meta = {
  title: 'Blocks/SectionToc',
  component: SectionToc,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: { appDirectory: true },
  },
} satisfies Meta<typeof SectionToc>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 縦（PC右固定の目次）＋実セクション。スクロールで現在地が自動追従。
 */
export const Vertical: Story = {
  args: { sections },
  render: (args) => (
    <div
      style={{
        display: 'flex',
        gap: 24,
        padding: 24,
        background: 'var(--colors-canvas)',
        alignItems: 'flex-start',
      }}
    >
      <MockSections />
      <aside style={{ position: 'sticky', top: 24, width: 200, flexShrink: 0 }}>
        <SectionToc {...args} />
      </aside>
    </div>
  ),
};

/**
 * 横（狭幅の上部固定向け）＋実セクション。
 */
export const Horizontal: Story = {
  args: { sections, orientation: 'horizontal' },
  render: (args) => (
    <div style={{ background: 'var(--colors-canvas)', minHeight: '100dvh' }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          background: 'var(--colors-canvas)',
          padding: '12px 24px',
          zIndex: 1,
        }}
      >
        <SectionToc {...args} />
      </div>
      <div style={{ padding: 24 }}>
        <MockSections />
      </div>
    </div>
  ),
};

/**
 * 現在地を外部制御（activeId）。スクロール非依存の表示確認用。
 */
export const Controlled: Story = {
  args: { sections, activeId: 'sessions' },
  decorators: [
    (Story) => (
      <div style={{ padding: 24, width: 220 }}>
        <Story />
      </div>
    ),
  ],
};

/**
 * 少数セクション（2件）
 */
export const FewSections: Story = {
  args: {
    sections: [
      { id: 'overview', label: '概要' },
      { id: 'comments', label: 'コメント' },
    ],
    activeId: 'overview',
  },
  decorators: [
    (Story) => (
      <div style={{ padding: 24, width: 220 }}>
        <Story />
      </div>
    ),
  ],
};
