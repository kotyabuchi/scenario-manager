import { defineTokens } from '@pandacss/dev';

export const spacing = defineTokens.spacing({
  xs: { value: '0.382rem' }, // 13px ÷ 1.618 ≈ 5px
  sm: { value: '0.618rem' }, // 13px ÷ 1.618 ≈ 8px
  md: { value: '0.8125rem' }, // 13px（基準）
  lg: { value: '1.3125rem' }, // 13px × 1.618 ≈ 21px
  xl: { value: '2.125rem' }, // 13px × 1.618² ≈ 34px
});
