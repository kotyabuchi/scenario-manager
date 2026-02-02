import { css } from '@/styled-system/css';

/**
 * Skeletonのベーススタイル（アニメーションあり）
 */
export const skeleton_baseAnimated = css({
  bg: 'gray.200',
  backgroundImage:
    '[linear-gradient(90deg, #E5E7EB 0%, #F3F4F6 50%, #E5E7EB 100%)]',
  backgroundSize: '[200% 100%]',
  animationName: 'shimmer',
  animationDuration: '[1.5s]',
  animationIterationCount: 'infinite',
});

/**
 * Skeletonのベーススタイル（アニメーションなし）
 */
export const skeleton_baseStatic = css({
  bg: 'gray.200',
  backgroundImage: 'none',
  animation: '[none]',
});

/**
 * テキストバリアントのスタイル
 */
export const skeleton_text = css({
  borderRadius: 'xs',
});

/**
 * 円形バリアントのスタイル
 */
export const skeleton_circle = css({
  borderRadius: 'full',
});

/**
 * 長方形バリアントのスタイル
 */
export const skeleton_rectangle = css({
  borderRadius: 'md',
});

/**
 * 複数行テキストのコンテナスタイル
 */
export const skeleton_linesContainer = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
});

/**
 * アバタープリセットのスタイル
 */
export const skeleton_avatarContainer = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
});

/**
 * アバタープリセットのテキスト部分
 */
export const skeleton_avatarTextContainer = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5',
});

/**
 * カードプリセットのスタイル
 */
export const skeleton_cardContainer = css({
  w: '[240px]',
  bg: 'white',
  borderRadius: 'lg',
  boxShadow: '[0 4px 16px rgba(0, 0, 0, 0.06)]',
  overflow: 'hidden',
});

/**
 * カードプリセットのコンテンツ部分
 */
export const skeleton_cardContent = css({
  p: '4',
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
});

/**
 * カードプリセットのメタ情報
 */
export const skeleton_cardMeta = css({
  display: 'flex',
  gap: '3',
});

/**
 * カードプリセットのタグ
 */
export const skeleton_cardTags = css({
  display: 'flex',
  gap: '1.5',
});

/**
 * 複数行テキストの最終行スタイル（60%幅）
 */
export const skeleton_lineLastStyle = css({
  width: '[60%]',
  height: '4',
});

/**
 * 複数行テキストの次から最後の行スタイル（80%幅）
 */
export const skeleton_lineSecondLastStyle = css({
  width: '[80%]',
  height: '4',
});

/**
 * 複数行テキストの通常行スタイル（100%幅）
 */
export const skeleton_lineNormalStyle = css({
  width: 'full',
  height: '4',
});
