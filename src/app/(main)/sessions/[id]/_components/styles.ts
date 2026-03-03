import { css } from '@/styled-system/css';

export { cx } from '@/styled-system/css';

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
  borderRadius: 'xl',
});

export const sessionSummary_label = css({
  fontSize: 'xs',
  color: 'text.secondary',
  fontWeight: 'medium',
});

export const sessionSummary_sessionName = css({
  fontSize: 'md',
  fontWeight: 'bold',
  color: 'text.title',
  lineHeight: 'tight',
});

export const sessionSummary_scenarioRow = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1.5',
  mt: '0.5',
});

export const sessionSummary_scenarioLabel = css({
  fontSize: 'xs',
  color: 'text.secondary',
});

export const sessionSummary_scenarioName = css({
  fontSize: 'xs',
  color: 'text.secondary',
  fontWeight: 'medium',
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
  display: 'grid',
  gridTemplateColumns: '[1fr 1fr]',
  gap: '3',
});

export const participantTypeCard = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '1.5',
  p: '4',
  borderRadius: 'xl',
  bg: 'bg.card',
  shadow: 'card.default',
  cursor: 'pointer',
  border: 'none',
  textAlign: 'left',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _hover: {
    shadow: 'card.hover',
    transform: 'translateY(-2px)',
  },
  _focusWithin: {
    outline: 'focusRing',
    outlineOffset: '[2px]',
  },
});

export const participantTypeCard_selected = css({
  bg: 'primary.subtle',
  shadow: 'card.hover',
  transform: 'translateY(-1px)',
});

export const participantTypeCard_iconWrapper = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '9',
  h: '9',
  borderRadius: 'lg',
  bg: 'chip.labelBg',
  shadow: 'sm',
  color: 'text.secondary',
  transitionProperty: 'common',
  transitionDuration: 'fast',
});

export const participantTypeCard_iconWrapper_selected = css({
  bg: 'primary.default',
  boxShadow: '[none]',
  color: 'white',
});

export const participantTypeCard_title = css({
  fontSize: 'sm',
  fontWeight: 'bold',
  color: 'text.title',
  lineHeight: 'tight',
});

export const participantTypeCard_description = css({
  fontSize: 'xs',
  color: 'text.secondary',
  lineHeight: 'relaxed',
});

export const participantTypeCard_radioInput = css({
  srOnly: true,
});

// ========================================
// テキストエリアフィールド
// ========================================

export const charCount = css({
  display: 'flex',
  justifyContent: 'flex-end',
  fontSize: 'xs',
  color: 'text.secondary',
  mt: '1',
});

export const charCount_warning = css({
  color: 'error.default',
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
