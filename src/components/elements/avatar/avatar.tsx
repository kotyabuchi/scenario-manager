import { User } from 'lucide-react';

import * as styles from './styles';

const iconSizeMap = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

export type AvatarProps = {
  /**
   * 画像URL
   */
  src?: string;

  /**
   * 代替テキスト
   */
  alt?: string;

  /**
   * サイズ
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';

  /**
   * カスタムフォールバック要素
   */
  fallback?: React.ReactNode;

  /**
   * 追加のクラス名
   */
  className?: string;
};

/**
 * アバターコンポーネント
 *
 * ユーザーのプロフィール画像を表示する。
 * 画像がない場合はフォールバックアイコンを表示する。
 *
 * @example
 * // 画像あり
 * <Avatar src="/user.jpg" alt="ユーザー名" />
 *
 * @example
 * // フォールバック（画像なし）
 * <Avatar alt="ユーザー名" />
 *
 * @example
 * // カスタムフォールバック（イニシャル）
 * <Avatar fallback={<span>AB</span>} />
 */
export const Avatar = ({
  src,
  alt,
  size = 'md',
  fallback,
  className,
}: AvatarProps) => {
  const iconSize = iconSizeMap[size];

  const renderContent = () => {
    if (src) {
      return <img src={src} alt={alt || ''} className={styles.avatarImage()} />;
    }

    if (fallback) {
      return (
        <div data-testid="avatar-fallback" className={styles.avatarFallback()}>
          {fallback}
        </div>
      );
    }

    return (
      <div data-testid="avatar-fallback" className={styles.avatarFallback()}>
        <User size={iconSize} />
      </div>
    );
  };

  return (
    <div
      data-testid="avatar"
      data-size={size}
      className={`${styles.avatar({ size })} ${className ?? ''}`}
    >
      {renderContent()}
    </div>
  );
};
