import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Pill } from './Pill';
import * as stories from './Pill.stories';

const { Default, Selectable, Removable, Disabled } = composeStories(stories);

describe('Pill', () => {
  describe('ポリモーフィック描画', () => {
    // PILL-01: selected/onClick が無ければ静的（button ではない）
    it('selected も onClick も無い場合は button にならない', () => {
      render(<Default />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.getByText('ラベル')).toBeInTheDocument();
    });

    // PILL-02: onClick があれば button になる
    it('onClick がある場合は button になる', () => {
      render(<Pill onClick={() => {}}>クリック</Pill>);

      expect(
        screen.getByRole('button', { name: /クリック/i }),
      ).toBeInTheDocument();
    });

    // PILL-03: selected があれば button になり aria-pressed を持つ
    it('selected がある場合は aria-pressed を持つ button になる', () => {
      render(<Selectable />);

      const pill = screen.getByRole('button');
      expect(pill).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('ドット', () => {
    // PILL-04: dot=true でドットが表示される
    it('dot=true でドットが表示される', () => {
      render(
        <Pill tone="pink" dot>
          募集中
        </Pill>,
      );

      expect(screen.getByTestId('pill-dot')).toBeInTheDocument();
    });

    // PILL-05: dot 未指定でドットが表示されない
    it('dot 未指定でドットが表示されない', () => {
      render(<Default />);

      expect(screen.queryByTestId('pill-dot')).not.toBeInTheDocument();
    });
  });

  describe('インタラクション', () => {
    // PILL-06: クリックで onClick が呼ばれる
    it('クリックで onClick が呼ばれる', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Pill onClick={handleClick}>クリック</Pill>);

      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    // PILL-07: disabled 時は onClick が呼ばれない
    it('disabled 時は onClick が呼ばれない', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Disabled onClick={handleClick} />);

      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('削除機能', () => {
    // PILL-08: removable で削除ボタンが表示され、children から aria-label を生成
    it('removable で削除ボタンが表示される（aria-label 自動生成）', () => {
      render(<Removable />);

      expect(screen.getByLabelText('ホラーを削除')).toBeInTheDocument();
    });

    // PILL-09: 削除クリックで onRemove が呼ばれ、onClick は呼ばれない
    it('削除クリックで onRemove のみ呼ばれる（伝播停止）', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      const handleRemove = vi.fn();

      render(
        <Pill
          shape="pill"
          selected
          removable
          onClick={handleClick}
          onRemove={handleRemove}
        >
          ホラー
        </Pill>,
      );

      await user.click(screen.getByLabelText('ホラーを削除'));
      expect(handleRemove).toHaveBeenCalledTimes(1);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('無効状態', () => {
    // PILL-10: disabled=true で button が無効になる
    it('disabled=true で button が無効になる', () => {
      render(<Disabled />);

      expect(screen.getByRole('button')).toBeDisabled();
    });
  });
});
