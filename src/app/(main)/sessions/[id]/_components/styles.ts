import { css, cva } from '@/styled-system/css';

// ========================================
// ダイアログ本体
// ========================================

export const form = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '5',
});

// ========================================
// セッション情報サマリー
// ========================================

export const sessionSummary = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1',
  p: '4',
  bg: 'bg.input',
  borderRadius: 'md',
});

export const sessionSummary_row = css({
  display: 'flex',
  alignItems: 'baseline',
  gap: '3',
});

export const sessionSummary_rowLabel = css({
  fontSize: 'xs',
  fontWeight: 'bold',
  color: 'primary.default',
  textTransform: 'uppercase',
  minW: '20',
  flexShrink: '0',
});

export const sessionSummary_rowValue = css({
  fontSize: 'sm',
  color: 'text.body',
});

// ========================================
// フォームフィールド共通
// ========================================

export const fieldGroup = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
});

export const fieldLabel = css({
  fontSize: 'xs',
  fontWeight: 'medium',
  color: 'text.secondary',
});

export const optionalBadge = css({
  display: 'inline',
  ml: '1.5',
  fontSize: 'xs',
  color: 'text.secondary',
  fontWeight: 'normal',
});

// ========================================
// 参加タイプ選択（ラジオカード）
// ========================================

export const participantTypeCards = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
});

export const participantTypeCard = cva({
  base: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '3',
    p: '4',
    borderRadius: 'md',
    bg: 'bg.card',
    shadow: 'card.default',
    cursor: 'pointer',
    border: 'none',
    textAlign: 'left',
    transitionProperty: 'common',
    transitionDuration: 'fast',
    _hover: {
      shadow: 'card.hover',
    },
    _focusVisibleWithin: {
      outline: 'focusRing',
      outlineOffset: '[2px]',
    },
  },
  variants: {
    selected: {
      true: {
        bg: 'primary.subtle',
        outlineWidth: '1px',
        outlineStyle: 'solid',
        outlineColor: 'primary.default/30',
      },
    },
  },
});

export const participantTypeCard_iconWrapper = cva({
  base: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    w: '9',
    h: '9',
    borderRadius: 'md',
    bg: 'chip.labelBg',
    // shadow: 'sm',
    color: 'text.secondary',
    transitionProperty: 'common',
    transitionDuration: 'fast',
  },
  variants: {
    selected: {
      true: {
        bg: 'white',
        color: 'primary.default',
      },
    },
  },
});

export const participantTypeCard_title = cva({
  base: {
    fontSize: 'sm',
    fontWeight: 'bold',
    color: 'text.title',
    lineHeight: 'tight',
  },
  variants: {
    selected: {
      true: {
        color: 'primary.text',
      },
    },
  },
});

export const participantTypeCard_description = cva({
  base: {
    fontSize: 'xs',
    color: 'text.secondary',
    lineHeight: 'relaxed',
  },
  variants: {
    selected: {
      true: {
        color: 'primary.default',
      },
    },
  },
});

export const participantTypeCard_content = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5',
  flex: '1',
  minW: '0',
});

export const participantTypeCard_radio = cva({
  base: {
    w: '5',
    h: '5',
    rounded: 'full',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: 'border.default',
    flexShrink: '0',
    transitionProperty: 'common',
    transitionDuration: 'fast',
  },
  variants: {
    selected: {
      true: {
        borderColor: 'primary.default',
        position: 'relative',
        _after: {
          content: '""',
          position: 'absolute',
          top: '[50%]',
          left: '[50%]',
          transform: 'translate(-50%, -50%)',
          w: '2.5',
          h: '2.5',
          rounded: 'full',
          bg: 'primary.default',
        },
      },
    },
  },
});

export const participantTypeCard_radioInput = css({
  srOnly: true,
});

// ========================================
// テキストエリアフィールド
// ========================================

export const charCount = cva({
  base: {
    display: 'flex',
    justifyContent: 'flex-end',
    fontSize: 'xs',
    color: 'text.secondary',
    mt: '1',
  },
  variants: {
    warning: {
      true: {
        color: 'error.default',
      },
    },
  },
});

// ========================================
// エラーメッセージ
// ========================================

export const serverError = css({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '2',
  p: '3',
  bg: 'badge.errorBg',
  borderRadius: 'lg',
  fontSize: 'sm',
  color: 'badge.errorText',
});

// ========================================
// ダイアログ共通（Cancel/Complete/Withdraw 各ダイアログで使用）
// ========================================

export const dialog_form = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '5',
});

export const dialog_field = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
});

export const dialog_label = css({
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'text.secondary',
});

export const dialog_serverError = css({
  bg: 'error.subtle',
  color: 'error.text',
  p: '3',
  borderRadius: 'lg',
  fontSize: 'sm',
});

// 情報ボックス（キャンセルダイアログ用、薄赤背景）
export const dialog_infoBox = css({
  display: 'flex',
  gap: '3',
  p: '4',
  borderRadius: 'xl',
  bg: 'error.subtle',
});

export const dialog_infoBox_icon = css({
  color: 'error.default',
  flexShrink: '0',
  mt: '0.5',
});

export const dialog_infoBox_content = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1',
});

export const dialog_infoBox_title = css({
  fontSize: 'sm',
  fontWeight: 'bold',
  color: 'error.textDark',
});

export const dialog_infoBox_description = css({
  fontSize: 'sm',
  color: 'error.text',
  lineHeight: 'relaxed',
});

// 警告ボックス（辞退ダイアログ用、極薄赤背景）
export const dialog_warningBox = css({
  display: 'flex',
  gap: '3',
  p: '4',
  borderRadius: 'xl',
  bg: 'error.subtleHover',
});

export const dialog_warningBox_icon = css({
  color: 'error.default',
  flexShrink: '0',
  mt: '0.5',
});

export const dialog_warningBox_content = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1',
});

export const dialog_warningBox_title = css({
  fontSize: 'sm',
  fontWeight: 'bold',
  color: 'error.textDark',
});

export const dialog_warningBox_description = css({
  fontSize: 'sm',
  color: 'text.body',
  lineHeight: 'relaxed',
});

// 必須バッジ
export const dialog_requiredBadge = css({
  fontSize: 'xs',
  color: 'error.default',
  fontWeight: 'medium',
  ml: '2',
});

// 完了ヘッダー
export const dialog_successHeader = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  p: '4',
  borderRadius: 'xl',
  bg: 'primary.subtle',
});

export const dialog_successIcon = css({
  color: 'primary.default',
  flexShrink: '0',
});

export const dialog_successTitle = css({
  fontSize: 'md',
  fontWeight: 'bold',
  color: 'primary.text',
});

// 確認メッセージ
export const dialog_message = css({
  fontSize: 'sm',
  color: 'text.body',
  lineHeight: 'relaxed',
});

// ========================================
// 参加申請ダイアログ（送信セクション）
// ========================================

export const dialog_subtitle = css({
  fontSize: 'sm',
  color: 'text.secondary',
});

export const dialog_submitSection = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '3',
  mt: '2',
});

export const dialog_submitButton = css({
  w: 'full',
  shadow: 'button.primary',
  _hover: {
    shadow: 'button.primaryHover',
  },
});

export const dialog_cancelLink = css({
  fontSize: 'sm',
  color: 'text.secondary',
  cursor: 'pointer',
  bg: 'transparent',
  border: 'none',
  p: '1',
  _hover: {
    textDecoration: 'underline',
  },
  _focusVisible: {
    outline: 'focusRing',
    outlineOffset: '[2px]',
  },
});
