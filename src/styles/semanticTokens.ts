export const semanticTokens = {
  colors: {
    primary: {
      default: {
        value: '{colors.primary.500}',
        description: 'プライマリカラー（通常）',
      },
      foreground: {
        value: '{colors.primary.500}',
        description: 'プライマリカラー上のテキスト',
      },
      emphasized: {
        value: '{colors.white}',
        description: '強調表示（ボタンなど）',
      },
      muted: {
        value: '{colors.primary.700}',
        description: '控えめなUI表示用',
      },
      subtle: {
        value: '{colors.primary.100}',
        description: '背景や区切りに使う淡い色',
      },
      disabled: {
        value: '{colors.primary.200}',
        description: '非活性状態のUI',
      },
      focusRing: {
        value: '{colors.primary.500}',
        description: 'フォーカスリング（アクセシビリティ用）',
      },
    },
    success: {
      default: {
        value: '{colors.success.500}',
        description: '成功状態の基準色',
      },
      foreground: {
        value: '{colors.success.900}',
        description: '成功メッセージの文字色',
      },
      subtle: {
        value: '{colors.success.100}',
        description: '成功通知の背景',
      },
    },
    warning: {
      default: {
        value: '{colors.warning.500}',
        description: '警告状態の基準色',
      },
      foreground: {
        value: '{colors.warning.900}',
        description: '警告テキストの色',
      },
      subtle: { value: '{colors.warning.100}', description: '警告の背景色' },
    },
    danger: {
      default: {
        value: '{colors.danger.500}',
        description: '危険・エラー状態',
      },
      foreground: {
        value: '{colors.danger.900}',
        description: 'エラーメッセージなどの文字色',
      },
      subtle: {
        value: '{colors.danger.100}',
        description: 'エラー通知の背景',
      },
    },
    info: {
      default: {
        value: '{colors.info.500}',
        description: '情報メッセージのベース色',
      },
      foreground: {
        value: '{colors.info.900}',
        description: '情報テキストの色',
      },
      subtle: { value: '{colors.info.100}', description: '情報背景' },
    },
    background: {
      default: {
        value: '{colors.background.500}',
        description: 'ページ背景全体',
      },
    },
    foreground: {
      default: {
        value: '{colors.foreground.500}',
        description: '通常のテキストカラー',
      },
    },
    border: {
      default: {
        value: '{colors.border.500}',
        description: '境界線などの色',
      },
    },
    placeholder: {
      default: {
        value: '{colors.placeholder.500}',
        description: 'フォームのプレースホルダー色',
      },
    },
    backdrop: {
      default: {
        value: '{colors.backdrop.500}',
        description: 'モーダル背景などの半透明黒',
      },
    },
  },
};
