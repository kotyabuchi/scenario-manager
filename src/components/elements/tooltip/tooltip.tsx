'use client';

import { Tooltip as ArkTooltip } from '@ark-ui/react/tooltip';

import * as styles from './styles';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export type TooltipProps = {
  /**
   * ツールチップの内容
   */
  content: React.ReactNode;

  /**
   * トリガー要素
   */
  children: React.ReactNode;

  /**
   * 配置位置
   * @default 'top'
   */
  placement?: TooltipPlacement;

  /**
   * 表示までの遅延時間（ms）
   * @default 300
   */
  delay?: number;

  /**
   * 追加のクラス名
   */
  className?: string;
};

/**
 * ツールチップコンポーネント
 *
 * 要素にホバーしたときに補足情報を表示する。
 *
 * @example
 * <Tooltip content="ヘルプテキスト">
 *   <button>ホバーしてください</button>
 * </Tooltip>
 */
export const Tooltip = ({
  content,
  children,
  placement = 'top',
  delay = 300,
  className,
}: TooltipProps) => {
  return (
    <ArkTooltip.Root openDelay={delay} positioning={{ placement }}>
      <ArkTooltip.Trigger asChild>{children}</ArkTooltip.Trigger>
      <ArkTooltip.Positioner>
        <ArkTooltip.Content
          className={`${styles.tooltipContent} ${className ?? ''}`}
        >
          <ArkTooltip.Arrow>
            <ArkTooltip.ArrowTip className={styles.tooltipArrowTip} />
          </ArkTooltip.Arrow>
          {content}
        </ArkTooltip.Content>
      </ArkTooltip.Positioner>
    </ArkTooltip.Root>
  );
};
