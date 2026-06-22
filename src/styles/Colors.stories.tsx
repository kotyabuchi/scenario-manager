import { colorValues } from './tokens/colorValues';

import type { Meta, StoryObj } from '@storybook/react';

/**
 * カラートークン一覧（colors.ts の生データ = colorValues を全件描画）
 *
 * colorValues に定義された色を**すべて**出す。ファミリー（スケール）は行で、
 * 単色（white/canvas 等）は単独で表示。透明度を持つ色（overlay/whiteA/shadow）は
 * チェッカー背景で重ねて確認できる。
 */
const meta = {
  title: 'Design Tokens/Colors',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type Leaf = { value: string };
const isLeaf = (v: unknown): v is Leaf =>
  typeof v === 'object' && v !== null && 'value' in v;

// 透明度を見せるためのチェッカー背景
const checker =
  'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 / 16px 16px';

const Swatch = ({ label, value }: { label: string; value: string }) => (
  <div
    style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}
  >
    <div
      style={{
        height: 48,
        borderRadius: 8,
        background: checker,
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ height: '100%', borderRadius: 8, background: value }} />
    </div>
    <div style={{ fontSize: 11, fontWeight: 600, color: '#333' }}>{label}</div>
    <div
      style={{
        fontSize: 10,
        color: '#888',
        fontFamily: 'monospace',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {value}
    </div>
  </div>
);

const Group = ({
  name,
  entries,
}: {
  name: string;
  entries: [string, Leaf][];
}) => (
  <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#222', margin: 0 }}>
      {name}
    </h3>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: 10,
      }}
    >
      {entries.map(([step, leaf]) => (
        <Swatch key={step} label={`${name}.${step}`} value={leaf.value} />
      ))}
    </div>
  </section>
);

/**
 * 全カラートークン（colorValues 全件）
 */
export const Palette: Story = {
  render: () => {
    const singles: [string, Leaf][] = [];
    const groups: [string, [string, Leaf][]][] = [];

    for (const [name, val] of Object.entries(colorValues)) {
      if (isLeaf(val)) {
        singles.push([name, val]);
      } else {
        const entries = Object.entries(val).filter((e): e is [string, Leaf] =>
          isLeaf(e[1]),
        );
        groups.push([name, entries]);
      }
    }

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
          padding: 24,
          background: '#fff',
        }}
      >
        {singles.length > 0 && <Group name="(single)" entries={singles} />}
        {groups.map(([name, entries]) => (
          <Group key={name} name={name} entries={entries} />
        ))}
      </div>
    );
  },
};
