import { css } from '@/styled-system/css';

/**
 * Divider のスタイル
 *
 * `<hr>` をセマンティックな区切り線として使う。既定は親幅いっぱい（full）。
 * 部分幅（%指定）のときは中央寄せ（mx: auto）になる。
 */
export const divider = css({
  width: 'full',
  height: '[1px]',
  flexShrink: '0',
  border: 'none',
  backgroundColor: 'border.subtle',
  mx: 'auto',
});
