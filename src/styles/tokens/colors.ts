import { defineTokens } from '@pandacss/dev';

export const colors = defineTokens.colors({
  // ========================================
  // 画面設計準拠カラーパレット
  // ========================================

  // White
  white: { value: '#FFFFFF' },

  // Gray Scale (H=264, blue-gray tint)
  gray: {
    50: { value: '#F6F7F7' },
    100: { value: '#EAEBED' },
    200: { value: '#D5D7DB' },
    300: { value: '#B4B7BF' },
    400: { value: '#9398A3' },
    500: { value: '#777E8C' },
    600: { value: '#5B6374' },
    700: { value: '#475061' },
    800: { value: '#383F4C' },
    900: { value: '#292F3A' },
  },

  // Primary: Brand Green (#059568 base)
  primary: {
    50: { value: '#E9FCF2' },
    100: { value: '#D1F5E3' },
    200: { value: '#AAE8C9' },
    300: { value: '#6FCEA3' },
    400: { value: '#34B181' },
    500: { value: '#059568' },
    600: { value: '#0B7552' },
    700: { value: '#085F41' },
    800: { value: '#074A33' },
    900: { value: '#083826' },
  },

  // Purple (H=303)
  purple: {
    50: { value: '#F8F5FD' },
    100: { value: '#EEE8F9' },
    200: { value: '#DED0F3' },
    300: { value: '#C4A9EA' },
    400: { value: '#AB80E1' },
    500: { value: '#9659DA' },
    600: { value: '#7A3DB8' },
    700: { value: '#633096' },
    800: { value: '#4E2478' },
    900: { value: '#3C195E' },
  },

  // Indigo (H=278)
  indigo: {
    50: { value: '#F5F6FD' },
    100: { value: '#E8EAF9' },
    200: { value: '#D0D5F3' },
    300: { value: '#ABB3EA' },
    400: { value: '#8790E1' },
    500: { value: '#6A70DA' },
    600: { value: '#504AD1' },
    700: { value: '#3F37B2' },
    800: { value: '#312A8F' },
    900: { value: '#241E71' },
  },

  // Pink (H=350)
  pink: {
    50: { value: '#FCF4F8' },
    100: { value: '#F8E5ED' },
    200: { value: '#F2CBDC' },
    500: { value: '#C14E8C' },
    700: { value: '#7D2F59' },
  },

  // Green (H=145)
  green: {
    50: { value: '#EBFDEA' },
    700: { value: '#285D2C' },
    800: { value: '#1D4A20' },
  },

  // Blue (H=260)
  blue: {
    50: { value: '#F3F7FD' },
    800: { value: '#173C78' },
  },

  // Orange/Amber (H=70)
  orange: {
    50: { value: '#FEF5EC' },
    100: { value: '#FBE8D2' },
    200: { value: '#F8D0A3' },
    300: { value: '#EEA74B' },
    400: { value: '#C78A3C' },
    500: { value: '#A57230' },
    600: { value: '#835923' },
    700: { value: '#6B471A' },
    800: { value: '#553711' },
    900: { value: '#422908' },
  },

  // Red (H=25)
  red: {
    50: { value: '#FDF4F4' },
    100: { value: '#FAE6E3' },
    200: { value: '#F6CCC8' },
    300: { value: '#EF9F98' },
    400: { value: '#E96C66' },
    500: { value: '#D54443' },
    600: { value: '#AA3433' },
    700: { value: '#8A2827' },
    800: { value: '#6F1D1D' },
    900: { value: '#561314' },
  },

  // Info (H=260)
  info: {
    50: { value: '#F3F7FD' },
    100: { value: '#E3ECF9' },
    200: { value: '#C8D9F3' },
    300: { value: '#9AB9EA' },
    400: { value: '#6C98E1' },
    500: { value: '#437BD9' },
    600: { value: '#2C60B5' },
    700: { value: '#214D95' },
    800: { value: '#173C78' },
    900: { value: '#0D2C5F' },
  },

  // Overlay colors
  overlay: {
    5: { value: 'rgba(0, 0, 0, 0.05)' },
    10: { value: 'rgba(0, 0, 0, 0.10)' },
    15: { value: 'rgba(0, 0, 0, 0.15)' },
    20: { value: 'rgba(0, 0, 0, 0.20)' },
    25: { value: 'rgba(0, 0, 0, 0.25)' },
    30: { value: 'rgba(0, 0, 0, 0.30)' },
    40: { value: 'rgba(0, 0, 0, 0.40)' },
    60: { value: 'rgba(0, 0, 0, 0.60)' },
  },

  // Primary shadow colors
  primaryShadow: {
    25: { value: 'rgba(5, 149, 104, 0.25)' },
  },

  // Red shadow colors
  redShadow: {
    25: { value: 'rgba(213, 68, 67, 0.25)' },
  },
});
