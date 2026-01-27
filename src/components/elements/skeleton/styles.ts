import { css } from '@/styled-system/css';

/**
 * Skeletonのベーススタイル（アニメーションあり）
 */
export const skeleton_baseAnimated = css({
  bg: '#E5E7EB',
  backgroundImage:
    'linear-gradient(90deg, #E5E7EB 0%, #F3F4F6 50%, #E5E7EB 100%)',
  backgroundSize: '200% 100%',
  animationName: 'shimmer',
  animationDuration: '1.5s',
  animationIterationCount: 'infinite',
});

/**
 * Skeletonのベーススタイル（アニメーションなし）
 */
export const skeleton_baseStatic = css({
  bg: '#E5E7EB',
  backgroundImage: 'none',
  animation: 'none',
});

/**
 * テキストバリアントのスタイル
 */
export const skeleton_text = css({
  borderRadius: '4px',
});

/**
 * 円形バリアントのスタイル
 */
export const skeleton_circle = css({
  borderRadius: '50%',
});

/**
 * 長方形バリアントのスタイル
 */
export const skeleton_rectangle = css({
  borderRadius: '8px',
});

/**
 * 複数行テキストのコンテナスタイル
 */
export const skeleton_linesContainer = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
});

/**
 * アバタープリセットのスタイル
 */
export const skeleton_avatarContainer = css({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
});

/**
 * アバタープリセットのテキスト部分
 */
export const skeleton_avatarTextContainer = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
});

/**
 * カードプリセットのスタイル
 */
export const skeleton_cardContainer = css({
  w: '240px',
  bg: 'white',
  borderRadius: '12px',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
  overflow: 'hidden',
});

/**
 * カードプリセットのコンテンツ部分
 */
export const skeleton_cardContent = css({
  p: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
});

/**
 * カードプリセットのメタ情報
 */
export const skeleton_cardMeta = css({
  display: 'flex',
  gap: '12px',
});

/**
 * カードプリセットのタグ
 */
export const skeleton_cardTags = css({
  display: 'flex',
  gap: '6px',
});

/**
 * 複数行テキストの最終行スタイル（60%幅）
 */
export const skeleton_lineLastStyle = css({
  width: '60%',
  height: '16px',
});

/**
 * 複数行テキストの次から最後の行スタイル（80%幅）
 */
export const skeleton_lineSecondLastStyle = css({
  width: '80%',
  height: '16px',
});

/**
 * 複数行テキストの通常行スタイル（100%幅）
 */
export const skeleton_lineNormalStyle = css({
  width: '100%',
  height: '16px',
});
