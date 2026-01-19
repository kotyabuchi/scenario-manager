export const semanticTokens = {
  colors: {
    bg: {
      base: {
        value: '{colors.layer.base}',
        description: 'ページ全体の背景（最下層）',
      },
      card: {
        value: '#ffffff',
        description: 'カードの背景色（白）',
      },
      subtle: {
        value: '{colors.layer.1}',
        description: 'カード・セクションの背景（第1層）',
      },
      muted: {
        value: '{colors.layer.2}',
        description: 'ネスト要素・入力フィールドの背景（第2層）',
      },
      emphasized: {
        value: '{colors.layer.3}',
        description: 'さらにネスト・ホバー状態の背景（第3層）',
      },
      placeholder: {
        value: '{colors.neutral.100}',
        description: 'プレースホルダー領域の背景（サムネイルなど）',
      },
    },

    surface: {
      default: {
        value: '{colors.layer.1}',
        description: 'カード・パネルのデフォルト背景',
      },
      raised: {
        value: '{colors.layer.1}',
        description: '浮き上がった面の背景',
      },
      sunken: {
        value: '{colors.layer.2}',
        description: '沈んだ面の背景（入力フィールドなど）',
      },
      hover: {
        value: '{colors.layer.3}',
        description: 'ホバー時の背景',
      },
    },

    primary: {
      default: {
        value: '{colors.primary.500}',
        description: 'プライマリカラー（通常）',
      },
      foreground: {
        white: {
          value: '{colors.white}',
          description: 'プライマリカラー上のテキスト',
        },
        dark: {
          value: '{colors.primary.950}',
          description: 'プライマリカラー上のテキスト',
        },
      },
      emphasized: {
        // WCAG AA準拠: subtle背景(0.94)との明度差0.52を確保
        value: '{colors.primary.800}',
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
        value: '{colors.white}',
        description: '成功メッセージの文字色',
      },
      emphasized: {
        // WCAG AA準拠: subtle背景(0.94)との明度差0.52を確保
        value: '{colors.success.800}',
        description: '成功状態の強調表示',
      },
      muted: {
        value: '{colors.success.600}',
        description: '控えめな成功表示',
      },
      subtle: {
        value: '{colors.success.100}',
        description: '成功通知の背景',
      },
      disabled: {
        value: '{colors.success.200}',
        description: '非活性状態の成功UI',
      },
      focusRing: {
        value: '{colors.success.500}',
        description: '成功要素のフォーカスリング',
      },
    },
    warning: {
      default: {
        value: '{colors.warning.500}',
        description: '警告状態の基準色',
      },
      foreground: {
        value: '{colors.white}',
        description: '警告テキストの色',
      },
      emphasized: {
        // WCAG AA準拠: subtle背景(0.95)との明度差0.45を確保
        value: '{colors.warning.800}',
        description: '警告状態の強調表示',
      },
      muted: {
        value: '{colors.warning.600}',
        description: '控えめな警告表示',
      },
      subtle: {
        value: '{colors.warning.100}',
        description: '警告の背景色',
      },
      disabled: {
        value: '{colors.warning.200}',
        description: '非活性状態の警告UI',
      },
      focusRing: {
        value: '{colors.warning.500}',
        description: '警告要素のフォーカスリング',
      },
    },
    danger: {
      default: {
        value: '{colors.danger.500}',
        description: '危険・エラー状態',
      },
      foreground: {
        white: {
          value: '{colors.white}',
          description: 'エラーメッセージなどの文字色',
        },
        dark: {
          value: '{colors.danger.950}',
          description: 'エラーメッセージなどの文字色',
        },
      },
      emphasized: {
        // WCAG AA準拠: subtle背景(0.94)との明度差0.54を確保
        value: '{colors.danger.800}',
        description: '危険状態の強調表示',
      },
      muted: {
        value: '{colors.danger.600}',
        description: '控えめな危険表示',
      },
      subtle: {
        value: '{colors.danger.100}',
        description: 'エラー通知の背景',
      },
      disabled: {
        value: '{colors.danger.200}',
        description: '非活性状態の危険UI',
      },
      focusRing: {
        value: '{colors.danger.500}',
        description: '危険要素のフォーカスリング',
      },
    },
    info: {
      default: {
        value: '{colors.info.500}',
        description: '情報メッセージのベース色',
      },
      foreground: {
        white: {
          value: '{colors.white}',
          description: '情報テキストの色（白）',
        },
        dark: {
          value: '{colors.info.950}',
          description: '情報テキストの色（暗）',
        },
      },
      emphasized: {
        // WCAG AA準拠: subtle背景(0.97)との明度差0.55を確保
        value: '{colors.info.800}',
        description: '情報状態の強調表示',
      },
      muted: {
        value: '{colors.info.400}',
        description: '控えめな情報表示',
      },
      subtle: {
        value: '{colors.info.50}',
        description: '情報背景',
      },
      disabled: {
        value: '{colors.info.200}',
        description: '非活性状態の情報UI',
      },
      focusRing: {
        value: '{colors.info.300}',
        description: '情報要素のフォーカスリング',
      },
    },
    neutral: {
      default: {
        value: '{colors.neutral.500}',
        description: 'ニュートラルカラー（デフォルト）',
      },
      foreground: {
        white: {
          value: '{colors.white}',
          description: 'ニュートラル上のテキスト（白）',
        },
        dark: {
          value: '{colors.neutral.900}',
          description: 'ニュートラル上のテキスト（暗）',
        },
      },
      emphasized: {
        value: '{colors.neutral.600}',
        description: '強調表示',
      },
      muted: {
        value: '{colors.neutral.400}',
        description: '控えめな表示',
      },
      subtle: {
        value: '{colors.neutral.100}',
        description: '背景用の淡い色',
      },
      disabled: {
        value: '{colors.neutral.200}',
        description: '非活性状態',
      },
      focusRing: {
        value: '{colors.neutral.300}',
        description: 'フォーカスリング',
      },
    },
    background: {
      default: {
        value: '{colors.layer.base}',
        description: 'ページ背景全体',
      },
    },
    foreground: {
      default: {
        value: '{colors.foreground.500}',
        description: '通常のテキストカラー',
      },
      muted: {
        // WCAG AA準拠: 背景(0.98)との明度差0.53を確保
        value: '{colors.neutral.600}',
        description: '控えめなテキストカラー',
      },
    },
    text: {
      primary: {
        value: '{colors.foreground.500}',
        description: 'メインのテキスト色（タイトルなど）',
      },
      secondary: {
        // WCAG AA準拠: 背景(0.98)との明度差0.53を確保
        value: '{colors.neutral.600}',
        description: 'サブテキスト色',
      },
      muted: {
        // WCAG AA準拠: 背景(0.98)との明度差0.53を確保
        value: '{colors.neutral.600}',
        description: '控えめなテキスト色（メタ情報など）',
      },
      subtle: {
        // WCAG AA準拠: 背景(0.98)との明度差0.43（大きめのテキスト用）
        value: '{colors.neutral.500}',
        description: '非常に控えめなテキスト色（18pt以上の大きいテキスト用）',
      },
    },
    border: {
      default: {
        value: '{colors.border.500}',
        description: '境界線などの色',
      },
      subtle: {
        value: '{colors.neutral.200}',
        description: '控えめな境界線',
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
    // チップ（選択可能なタグ・バッジ）
    chip: {
      default: {
        value: 'oklch(0.97 0 0)',
        description: '非選択チップの背景（ほぼ白）',
      },
      hover: {
        value: 'oklch(0.94 0 0)',
        description: '非選択チップのホバー背景',
      },
    },
    // オーバーレイ（サムネイル上のラベル・ボタン）
    overlay: {
      light: {
        value: 'rgba(255,255,255,0.85)',
        description: '明るいオーバーレイ（システムラベル等）',
      },
      dark: {
        value: 'rgba(0,0,0,0.4)',
        description: '暗いオーバーレイ（ボタン等）',
      },
      darkHover: {
        value: 'rgba(0,0,0,0.6)',
        description: '暗いオーバーレイのホバー',
      },
    },
    // サイドメニュー（ナビゲーションパネル）
    sidemenu: {
      bg: {
        value: '#ffffff',
        description: 'サイドメニューの背景（白で明確に面を表現）',
      },
      itemBg: {
        value: 'oklch(0.97 0.008 145)',
        description: 'メニューアイテムのホバー背景',
      },
    },
    // ドロップダウンメニュー
    menu: {
      bg: {
        value: '#ffffff',
        description: 'メニューの背景（白）',
      },
      itemBg: {
        value: 'oklch(0.97 0 0)',
        description: 'メニューアイテムのホバー背景',
      },
      itemBgHighlighted: {
        value: 'oklch(0.94 0 0)',
        description: 'メニューアイテムのハイライト背景',
      },
      itemBgDanger: {
        value: '{colors.danger.subtle}',
        description: '危険アクションのホバー背景',
      },
      separator: {
        value: '{colors.neutral.200}',
        description: 'セパレーターの色',
      },
    },
  },

  shadows: {
    sm: {
      value: '0 1px 2px 0 oklch(0.20 0.01 270 / 0.05)',
      description: '小さな影',
    },
    md: {
      value:
        '0 4px 6px -1px oklch(0.20 0.01 270 / 0.07), 0 2px 4px -2px oklch(0.20 0.01 270 / 0.05)',
      description: '中程度の影',
    },
    lg: {
      value:
        '0 10px 15px -3px oklch(0.20 0.01 270 / 0.08), 0 4px 6px -4px oklch(0.20 0.01 270 / 0.05)',
      description: '大きな影',
    },
    xl: {
      value:
        '0 20px 25px -5px oklch(0.20 0.01 270 / 0.10), 0 8px 10px -6px oklch(0.20 0.01 270 / 0.05)',
      description: '特大の影',
    },
    // カード用の影（ボーダーレスUI）
    card: {
      default: {
        value: '0 2px 6px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05)',
        description: 'カードの基本影',
      },
      hover: {
        value: '0 6px 16px rgba(0,0,0,0.12), 0 3px 6px rgba(0,0,0,0.08)',
        description: 'カードホバー時の影',
      },
    },
    // チップ用の影（選択可能なタグ・バッジ）
    chip: {
      default: {
        value: '0 1px 3px rgba(0,0,0,0.08)',
        description: 'チップの基本影',
      },
      hover: {
        value: '0 2px 4px rgba(0,0,0,0.12)',
        description: 'チップホバー時の影',
      },
      selected: {
        value: '0 2px 4px rgba(0,0,0,0.15)',
        description: '選択されたチップの影',
      },
      selectedHover: {
        value: '0 4px 8px rgba(0,0,0,0.2)',
        description: '選択されたチップホバー時の影',
      },
    },
    // サイドメニュー用の影（ナビゲーションパネル）
    sidemenu: {
      default: {
        value:
          '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03)',
        description: 'サイドメニューの影（輪郭を明確に）',
      },
      hover: {
        value:
          '0 8px 24px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
        description: 'サイドメニュー展開時の影',
      },
    },
    // ドロップダウンメニュー用の影
    menu: {
      default: {
        value:
          '0 10px 38px -10px rgba(22, 23, 24, 0.35), 0 10px 20px -15px rgba(22, 23, 24, 0.2)',
        description: 'メニューの影（フローティング感）',
      },
    },
  },
};
