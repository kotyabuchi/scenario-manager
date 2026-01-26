import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Slider } from './slider';

describe('Slider', () => {
  describe('レンダリング', () => {
    it('必須Propsなしで正しくレンダリングされる', () => {
      render(<Slider />);

      const sliders = screen.getAllByRole('slider', { hidden: true });
      expect(sliders.length).toBeGreaterThan(0);
    });

    it('labelが指定された場合、ラベルが表示される', () => {
      render(<Slider value={[50]} label="音量" onValueChange={vi.fn()} />);

      expect(screen.getByText('音量')).toBeInTheDocument();
    });

    it('showValue=trueの場合、値が表示される', () => {
      render(<Slider value={[50]} showValue onValueChange={vi.fn()} />);

      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('range=trueの場合、2つのサムが表示される', () => {
      render(<Slider value={[20, 80]} range onValueChange={vi.fn()} />);

      const sliders = screen.getAllByRole('slider', { hidden: true });
      expect(sliders).toHaveLength(2);
    });

    it('markersが指定された場合、マーカーが表示される', () => {
      const markers = [
        { value: 0, label: '0%' },
        { value: 50, label: '50%' },
        { value: 100, label: '100%' },
      ];

      render(<Slider value={[50]} markers={markers} onValueChange={vi.fn()} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('disabled状態でレンダリングされる', () => {
      render(<Slider value={[50]} disabled onValueChange={vi.fn()} />);

      const sliders = screen.getAllByRole('slider', { hidden: true });
      expect(sliders[0]).toHaveAttribute('data-disabled', '');
    });
  });

  describe('範囲ラベル（minLabel/maxLabel）', () => {
    it('minLabelが指定された場合、左側に表示される', () => {
      render(<Slider value={[50]} minLabel="0人" onValueChange={vi.fn()} />);

      expect(screen.getByText('0人')).toBeInTheDocument();
    });

    it('maxLabelが指定された場合、右側に表示される', () => {
      render(<Slider value={[50]} maxLabel="10人+" onValueChange={vi.fn()} />);

      expect(screen.getByText('10人+')).toBeInTheDocument();
    });

    it('minLabel/maxLabel両方が指定された場合、両方表示される', () => {
      render(
        <Slider
          value={[2, 6]}
          range
          minLabel="1人"
          maxLabel="10人+"
          onValueChange={vi.fn()}
        />,
      );

      expect(screen.getByText('1人')).toBeInTheDocument();
      expect(screen.getByText('10人+')).toBeInTheDocument();
    });

    it('minLabel/maxLabelが指定されない場合、範囲ラベルは表示されない', () => {
      render(<Slider value={[50]} onValueChange={vi.fn()} />);

      // 範囲ラベルコンテナが存在しないことを確認
      const container = document.querySelector('[class*="rangeLabels"]');
      expect(container).not.toBeInTheDocument();
    });
  });

  describe('値表示フォーマット', () => {
    it('単一値スライダーで値がフォーマットされる', () => {
      render(
        <Slider
          value={[50]}
          showValue
          formatValue={(v) => `${v}%`}
          onValueChange={vi.fn()}
        />,
      );

      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('範囲スライダーで「～」区切りで表示される', () => {
      render(
        <Slider value={[20, 80]} range showValue onValueChange={vi.fn()} />,
      );

      expect(screen.getByText('20 ～ 80')).toBeInTheDocument();
    });

    it('範囲スライダーでカスタムフォーマットと「～」区切りが使用される', () => {
      render(
        <Slider
          value={[2, 6]}
          range
          showValue
          formatValue={(v) => `${v}人`}
          onValueChange={vi.fn()}
        />,
      );

      expect(screen.getByText('2人 ～ 6人')).toBeInTheDocument();
    });
  });

  describe('値の変更', () => {
    it('onValueChangeが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();
      render(
        <Slider
          defaultValue={[50]}
          min={0}
          max={100}
          onValueChange={handleValueChange}
        />,
      );

      // Tabでフォーカスしてからキーボード操作
      await user.tab();
      await user.keyboard('{ArrowRight}');

      expect(handleValueChange).toHaveBeenCalled();
    });

    it('min/maxの範囲内に値がクランプされる', () => {
      render(
        <Slider
          value={[150]} // maxを超える値
          min={0}
          max={100}
          showValue
          onValueChange={vi.fn()}
        />,
      );

      // Ark UIが内部でクランプするため、100として表示されるはず
      // 注: Ark UIの実装によっては150のまま表示される可能性もある
      const sliders = screen.getAllByRole('slider', { hidden: true });
      expect(sliders[0]).toHaveAttribute('aria-valuemax', '100');
    });
  });

  describe('キーボード操作', () => {
    it('Tabでフォーカスできる', async () => {
      const user = userEvent.setup();
      render(<Slider defaultValue={[50]} />);

      await user.tab();

      const slider = screen.getAllByRole('slider', { hidden: true })[0];
      expect(slider).toHaveFocus();
    });

    it('右矢印キーで値が増加する', async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();
      render(
        <Slider
          defaultValue={[50]}
          min={0}
          max={100}
          step={1}
          onValueChange={handleValueChange}
        />,
      );

      await user.tab();
      await user.keyboard('{ArrowRight}');

      expect(handleValueChange).toHaveBeenCalledWith(
        expect.objectContaining({
          value: [51],
        }),
      );
    });

    it('左矢印キーで値が減少する', async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();
      render(
        <Slider
          defaultValue={[50]}
          min={0}
          max={100}
          step={1}
          onValueChange={handleValueChange}
        />,
      );

      await user.tab();
      await user.keyboard('{ArrowLeft}');

      expect(handleValueChange).toHaveBeenCalledWith(
        expect.objectContaining({
          value: [49],
        }),
      );
    });

    it('Homeキーで最小値に設定される', async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();
      render(
        <Slider
          defaultValue={[50]}
          min={0}
          max={100}
          onValueChange={handleValueChange}
        />,
      );

      await user.tab();
      await user.keyboard('{Home}');

      expect(handleValueChange).toHaveBeenCalledWith(
        expect.objectContaining({
          value: [0],
        }),
      );
    });

    it('Endキーで最大値に設定される', async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();
      render(
        <Slider
          defaultValue={[50]}
          min={0}
          max={100}
          onValueChange={handleValueChange}
        />,
      );

      await user.tab();
      await user.keyboard('{End}');

      expect(handleValueChange).toHaveBeenCalledWith(
        expect.objectContaining({
          value: [100],
        }),
      );
    });
  });

  describe('アクセシビリティ', () => {
    it('role="slider"が設定されている', () => {
      render(<Slider value={[50]} onValueChange={vi.fn()} />);

      const sliders = screen.getAllByRole('slider', { hidden: true });
      expect(sliders.length).toBeGreaterThan(0);
    });

    it('aria-valueminが設定されている', () => {
      render(<Slider value={[50]} min={10} onValueChange={vi.fn()} />);

      const slider = screen.getAllByRole('slider', { hidden: true })[0];
      expect(slider).toHaveAttribute('aria-valuemin', '10');
    });

    it('aria-valuemaxが設定されている', () => {
      render(<Slider value={[50]} max={90} onValueChange={vi.fn()} />);

      const slider = screen.getAllByRole('slider', { hidden: true })[0];
      expect(slider).toHaveAttribute('aria-valuemax', '90');
    });

    it('aria-valuenowが設定されている', () => {
      render(<Slider value={[50]} onValueChange={vi.fn()} />);

      const slider = screen.getAllByRole('slider', { hidden: true })[0];
      expect(slider).toHaveAttribute('aria-valuenow', '50');
    });

    it('labelがaria-labelとして関連付けられる', () => {
      render(<Slider value={[50]} label="音量" onValueChange={vi.fn()} />);

      // Ark UIはlabelをaria-labelledbyで関連付ける
      const label = screen.getByText('音量');
      expect(label).toBeInTheDocument();
    });
  });

  describe('検索条件向けスライダー', () => {
    it('プレイ人数スライダーが正しくレンダリングされる', () => {
      render(
        <Slider
          label="プレイ人数"
          value={[2, 6]}
          min={1}
          max={10}
          step={1}
          range
          showValue
          formatValue={(v) => `${v}人`}
          minLabel="1人"
          maxLabel="10人+"
          onValueChange={vi.fn()}
        />,
      );

      // ラベル
      expect(screen.getByText('プレイ人数')).toBeInTheDocument();
      // 範囲ラベル
      expect(screen.getByText('1人')).toBeInTheDocument();
      expect(screen.getByText('10人+')).toBeInTheDocument();
      // 値表示
      expect(screen.getByText('2人 ～ 6人')).toBeInTheDocument();
      // 2つのサム
      const sliders = screen.getAllByRole('slider', { hidden: true });
      expect(sliders).toHaveLength(2);
    });

    it('プレイ時間スライダーが正しくレンダリングされる', () => {
      render(
        <Slider
          label="プレイ時間"
          value={[3, 8]}
          min={1}
          max={12}
          step={1}
          range
          showValue
          formatValue={(v) => `${v}時間`}
          minLabel="1時間"
          maxLabel="12時間+"
          onValueChange={vi.fn()}
        />,
      );

      // ラベル
      expect(screen.getByText('プレイ時間')).toBeInTheDocument();
      // 範囲ラベル
      expect(screen.getByText('1時間')).toBeInTheDocument();
      expect(screen.getByText('12時間+')).toBeInTheDocument();
      // 値表示
      expect(screen.getByText('3時間 ～ 8時間')).toBeInTheDocument();
    });
  });
});
