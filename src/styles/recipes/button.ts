import { defineRecipe } from '@pandacss/dev';

/**
 * ボタンレシピ - 画面設計準拠
 *
 * バリアント:
 * - variant: solid, subtle, ghost, outline
 * - status: primary, danger (色のセマンティクス)
 */
export const button = defineRecipe({
  className: 'button',
  jsx: ['Button', 'IconButton', 'LinkButton', 'SubmitButton'],
  base: {
    alignItems: 'center',
    appearance: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'inline-flex',
    fontWeight: '500',
    fontFamily: 'body',
    isolation: 'isolate',
    minWidth: 'fit-content',
    justifyContent: 'center',
    outline: 'none',
    position: 'relative',
    transitionDuration: 'fast',
    transitionProperty: 'background, border-color, color, box-shadow, opacity',
    transitionTimingFunction: 'ease-out',
    userSelect: 'none',
    verticalAlign: 'middle',
    whiteSpace: 'nowrap',
    gap: '8px',
    _focusVisible: {
      outline: '2px solid',
      outlineColor: 'primary.default',
      outlineOffset: '2px',
    },
    _disabled: {
      cursor: 'not-allowed',
      opacity: 'disabled',
      bg: 'button.disabledBg',
      color: 'button.disabledText',
      boxShadow: 'none',
      _hover: {
        bg: 'button.disabledBg',
        color: 'button.disabledText',
      },
    },
    _hidden: {
      display: 'none',
    },
  },
  variants: {
    /** スタイルバリアント */
    variant: {
      // Solid: 塗りつぶし
      solid: {},
      // Subtle: 薄い背景
      subtle: {},
      // Ghost: 背景なし
      ghost: {},
      // Outline: 枠線のみ
      outline: {
        borderWidth: '[1px]',
        borderStyle: 'solid',
        borderColor: 'gray.100',
      },
    },
    /** カラーステータス */
    status: {
      primary: {},
      danger: {},
    },
    /** サイズ */
    size: {
      sm: {
        h: '36px',
        minW: '36px',
        fontSize: '14px',
        px: '16px',
        '& :where(svg)': {
          width: '16px',
          height: '16px',
        },
      },
      md: {
        h: '44px',
        minW: '44px',
        fontSize: '14px',
        px: '20px',
        '& :where(svg)': {
          width: '16px',
          height: '16px',
        },
      },
      lg: {
        h: '48px',
        minW: '48px',
        fontSize: '14px',
        px: '24px',
        '& :where(svg)': {
          width: '16px',
          height: '16px',
        },
      },
    },
  },
  compoundVariants: [
    // Solid + Primary
    {
      variant: 'solid',
      status: 'primary',
      css: {
        bg: 'button.primaryBg',
        color: 'button.primaryText',
        fontWeight: '600',
        boxShadow: 'sm',
        _hover: {
          '&:not([disabled])': {
            bg: 'button.primaryBgHover',
          },
        },
      },
    },
    // Solid + Danger
    {
      variant: 'solid',
      status: 'danger',
      css: {
        bg: 'button.destructiveBg',
        color: 'button.destructiveText',
        fontWeight: '600',
        boxShadow: 'sm',
        _hover: {
          '&:not([disabled])': {
            bg: 'button.destructiveBgHover',
          },
        },
      },
    },
    // Subtle + Primary
    {
      variant: 'subtle',
      status: 'primary',
      css: {
        bg: 'button.subtleBg',
        color: 'button.subtleText',
        _hover: {
          '&:not([disabled])': {
            bg: 'button.subtleBgHover',
          },
        },
      },
    },
    // Subtle + Danger
    {
      variant: 'subtle',
      status: 'danger',
      css: {
        bg: 'error.subtle',
        color: 'error.text',
        _hover: {
          '&:not([disabled])': {
            bg: 'error.subtleHover',
          },
        },
      },
    },
    // Ghost + Primary
    {
      variant: 'ghost',
      status: 'primary',
      css: {
        bg: 'transparent',
        color: 'button.ghostText',
        _hover: {
          '&:not([disabled])': {
            color: 'button.ghostTextHover',
          },
        },
      },
    },
    // Ghost + Danger
    {
      variant: 'ghost',
      status: 'danger',
      css: {
        bg: 'transparent',
        color: 'error.text',
        _hover: {
          '&:not([disabled])': {
            color: 'error.hover',
          },
        },
      },
    },
    // Outline + Primary
    {
      variant: 'outline',
      status: 'primary',
      css: {
        bg: 'button.secondaryBg',
        color: 'button.secondaryText',
        boxShadow: 'sm',
        _hover: {
          '&:not([disabled])': {
            bg: 'button.secondaryBgHover',
          },
        },
      },
    },
    // Outline + Danger
    {
      variant: 'outline',
      status: 'danger',
      css: {
        bg: 'white',
        color: 'error.text',
        boxShadow: 'sm',
        _hover: {
          '&:not([disabled])': {
            bg: 'error.subtleHover',
          },
        },
      },
    },
  ],
  defaultVariants: {
    variant: 'solid',
    status: 'primary',
    size: 'md',
  },
});
