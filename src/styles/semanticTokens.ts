export const semanticTokens = {
  colors: {
    // ========================================
    // 背景色
    // ========================================
    bg: {
      // ページ背景
      page: { value: '#F5F7FA' },
      // カード・パネル背景
      card: { value: '{colors.white}' },
      // 入力フィールド背景
      input: { value: '{colors.gray.100}' },
      // 無効状態の背景
      disabled: { value: '{colors.gray.200}' },
      // エラー入力背景
      error: { value: '{colors.red.50}' },
      // 成功/選択状態背景
      success: { value: '{colors.primary.50}' },
      // 警告背景
      warning: { value: '{colors.orange.100}' },
    },

    // ========================================
    // テキスト色
    // ========================================
    text: {
      // タイトル・見出し
      title: { value: '{colors.gray.800}' },
      // 本文・ラベル
      body: { value: '{colors.gray.700}' },
      // サブテキスト・補足
      secondary: { value: '{colors.gray.500}' },
      // プレースホルダー・無効テキスト
      placeholder: { value: '{colors.gray.400}' },
      // 白テキスト（濃い背景上）
      white: { value: '{colors.white}' },
      // エラーテキスト
      error: { value: '{colors.red.500}' },
      // 成功テキスト
      success: { value: '{colors.primary.800}' },
      // 警告テキスト
      warning: { value: '{colors.orange.800}' },
    },

    // ========================================
    // プライマリ（緑）
    // ========================================
    primary: {
      default: { value: '{colors.primary.500}' },
      hover: { value: '{colors.primary.600}' },
      active: { value: '{colors.primary.700}' },
      subtle: { value: '{colors.primary.100}' },
      subtleHover: { value: '{colors.primary.50}' },
      text: { value: '{colors.primary.800}' },
      textOnPrimary: { value: '{colors.white}' },
    },

    // ========================================
    // エラー（赤）
    // ========================================
    error: {
      default: { value: '{colors.red.500}' },
      hover: { value: '{colors.red.600}' },
      subtle: { value: '{colors.red.100}' },
      subtleHover: { value: '{colors.red.50}' },
      text: { value: '{colors.red.600}' },
      textDark: { value: '{colors.red.800}' },
      textOnError: { value: '{colors.white}' },
    },

    // ========================================
    // 警告（オレンジ）
    // ========================================
    warning: {
      default: { value: '{colors.orange.500}' },
      hover: { value: '{colors.orange.600}' },
      subtle: { value: '{colors.orange.100}' },
      text: { value: '{colors.orange.800}' },
      textOnWarning: { value: '{colors.white}' },
    },

    // ========================================
    // パープル（システムバッジ用）
    // ========================================
    purple: {
      default: { value: '{colors.purple.500}' },
      hover: { value: '{colors.purple.600}' },
      subtle: { value: '{colors.purple.100}' },
      text: { value: '{colors.purple.800}' },
      textOnPurple: { value: '{colors.white}' },
    },

    // ========================================
    // レーティング（黄色）
    // ========================================
    rating: {
      filled: { value: '{colors.orange.400}' },
      empty: { value: '{colors.gray.200}' },
    },

    // ========================================
    // お気に入り
    // ========================================
    favorite: {
      active: { value: '{colors.orange.500}' },
      inactive: { value: '{colors.overlay.40}' },
      inactiveHover: { value: '{colors.overlay.60}' },
    },

    // ========================================
    // ボーダー
    // ========================================
    border: {
      default: { value: '{colors.gray.300}' },
      subtle: { value: '{colors.gray.200}' },
      focus: { value: '{colors.primary.500}' },
      error: { value: '{colors.red.500}' },
    },

    // ========================================
    // オーバーレイ
    // ========================================
    overlay: {
      light: { value: 'rgba(255, 255, 255, 0.85)' },
      dark: { value: '{colors.overlay.40}' },
      darkHover: { value: '{colors.overlay.60}' },
      backdrop: { value: '{colors.overlay.20}' },
    },

    // ========================================
    // アイコン
    // ========================================
    icon: {
      default: { value: '{colors.gray.500}' },
      muted: { value: '{colors.gray.400}' },
      white: { value: '{colors.white}' },
      primary: { value: '{colors.primary.500}' },
      error: { value: '{colors.red.500}' },
    },

    // ========================================
    // ボタン
    // ========================================
    button: {
      // Primary Button
      primaryBg: { value: '{colors.primary.500}' },
      primaryBgHover: { value: '{colors.primary.600}' },
      primaryText: { value: '{colors.white}' },
      // Secondary Button
      secondaryBg: { value: '{colors.white}' },
      secondaryBgHover: { value: '{colors.gray.50}' },
      secondaryText: { value: '{colors.gray.700}' },
      // Subtle Button
      subtleBg: { value: '{colors.gray.100}' },
      subtleBgHover: { value: '{colors.gray.200}' },
      subtleText: { value: '{colors.gray.700}' },
      // Destructive Button
      destructiveBg: { value: '{colors.red.500}' },
      destructiveBgHover: { value: '{colors.red.600}' },
      destructiveText: { value: '{colors.white}' },
      // Disabled Button
      disabledBg: { value: '{colors.gray.200}' },
      disabledText: { value: '{colors.gray.400}' },
      // Ghost Button
      ghostText: { value: '{colors.gray.400}' },
      ghostTextHover: { value: '{colors.gray.500}' },
    },

    // ========================================
    // チップ/タグ
    // ========================================
    chip: {
      // Selectable (緑)
      selectableBg: { value: '{colors.primary.100}' },
      selectableText: { value: '{colors.primary.800}' },
      // Label (グレー)
      labelBg: { value: '{colors.gray.100}' },
      labelText: { value: '{colors.gray.600}' },
      // Error (赤)
      errorBg: { value: '{colors.red.100}' },
      errorText: { value: '{colors.red.600}' },
      // Outline
      outlineBg: { value: '{colors.white}' },
      outlineBorder: { value: '{colors.gray.300}' },
      outlineText: { value: '{colors.gray.500}' },
    },

    // ========================================
    // 入力フィールド
    // ========================================
    input: {
      bg: { value: '{colors.gray.100}' },
      bgDisabled: { value: '{colors.gray.200}' },
      bgError: { value: '{colors.red.50}' },
      text: { value: '{colors.gray.800}' },
      placeholder: { value: '{colors.gray.400}' },
      label: { value: '{colors.gray.700}' },
      focusBorder: { value: '{colors.primary.500}' },
      errorBorder: { value: '{colors.red.500}' },
    },

    // ========================================
    // スライダー
    // ========================================
    slider: {
      track: { value: '{colors.gray.200}' },
      fill: { value: '{colors.primary.500}' },
      thumb: { value: '{colors.white}' },
      valueText: { value: '{colors.primary.500}' },
    },

    // ========================================
    // チェックボックス/ラジオ/スイッチ
    // ========================================
    toggle: {
      uncheckedBg: { value: '{colors.white}' },
      checkedBg: { value: '{colors.primary.500}' },
      disabledBg: { value: '{colors.gray.200}' },
      switchTrack: { value: '{colors.gray.200}' },
      switchTrackOn: { value: '{colors.primary.500}' },
    },

    // ========================================
    // ドロップダウン/メニュー
    // ========================================
    menu: {
      bg: { value: '{colors.white}' },
      itemBg: { value: 'transparent' },
      itemBgHover: { value: '{colors.gray.50}' },
      itemBgSelected: { value: '{colors.primary.50}' },
      itemText: { value: '{colors.gray.700}' },
      itemTextSelected: { value: '{colors.primary.500}' },
    },

    // ========================================
    // タブ
    // ========================================
    tab: {
      bg: { value: '{colors.gray.100}' },
      activeBg: { value: '{colors.white}' },
      activeText: { value: '{colors.gray.800}' },
      inactiveText: { value: '{colors.gray.500}' },
      underlineActive: { value: '{colors.primary.500}' },
      underlineInactive: { value: '{colors.gray.200}' },
    },

    // ========================================
    // ツールチップ
    // ========================================
    tooltip: {
      bg: { value: '{colors.gray.800}' },
      text: { value: '{colors.white}' },
    },

    // ========================================
    // トースト
    // ========================================
    toast: {
      bg: { value: '{colors.white}' },
      successIcon: { value: '{colors.primary.500}' },
      successIconBg: { value: '{colors.primary.100}' },
      errorIcon: { value: '{colors.red.500}' },
      errorIconBg: { value: '{colors.red.100}' },
      title: { value: '{colors.gray.800}' },
      description: { value: '{colors.gray.500}' },
      close: { value: '{colors.gray.400}' },
    },

    // ========================================
    // ページネーション
    // ========================================
    pagination: {
      bg: { value: '{colors.white}' },
      activeBg: { value: '{colors.primary.500}' },
      activeText: { value: '{colors.white}' },
      inactiveText: { value: '{colors.gray.700}' },
      icon: { value: '{colors.gray.500}' },
    },

    // ========================================
    // バッジ
    // ========================================
    badge: {
      successBg: { value: '{colors.primary.100}' },
      successDot: { value: '{colors.primary.500}' },
      successText: { value: '{colors.primary.800}' },
      warningBg: { value: '{colors.orange.100}' },
      warningDot: { value: '{colors.orange.500}' },
      warningText: { value: '{colors.orange.800}' },
      errorBg: { value: '{colors.red.100}' },
      errorDot: { value: '{colors.red.500}' },
      errorText: { value: '{colors.red.800}' },
      neutralBg: { value: '{colors.gray.100}' },
      neutralDot: { value: '{colors.gray.500}' },
      neutralText: { value: '{colors.gray.700}' },
    },

    // ========================================
    // プログレス
    // ========================================
    progress: {
      track: { value: '{colors.gray.200}' },
      fill: { value: '{colors.primary.500}' },
      text: { value: '{colors.primary.500}' },
      circleBg: { value: '{colors.gray.200}' },
      circleFg: { value: '{colors.white}' },
    },

    // ========================================
    // アバター
    // ========================================
    avatar: {
      bg: { value: '{colors.primary.100}' },
      icon: { value: '{colors.primary.500}' },
      placeholder: { value: '{colors.gray.200}' },
    },

    // ========================================
    // スケルトン
    // ========================================
    skeleton: {
      base: { value: '{colors.gray.200}' },
      highlight: { value: '{colors.gray.100}' },
    },

    // ========================================
    // ダイアログ
    // ========================================
    dialog: {
      bg: { value: '{colors.white}' },
      title: { value: '{colors.gray.800}' },
      content: { value: '{colors.gray.500}' },
      close: { value: '{colors.gray.400}' },
    },

    // ========================================
    // ヘッダー
    // ========================================
    header: {
      bg: { value: '{colors.white}' },
      text: { value: '{colors.gray.500}' },
      textActive: { value: '{colors.primary.500}' },
      logo: { value: '{colors.primary.500}' },
      logoBg: { value: '{colors.primary.100}' },
    },

    // ========================================
    // カード
    // ========================================
    card: {
      bg: { value: '{colors.white}' },
      title: { value: '{colors.gray.800}' },
      meta: { value: '{colors.gray.500}' },
    },

    // ========================================
    // システムバッジ（TRPGシステム識別用）
    // ========================================
    systemBadge: {
      green: { value: '{colors.primary.500}' },
      purple: { value: '{colors.purple.500}' },
      orange: { value: '{colors.orange.500}' },
    },

    // ========================================
    // スクロールバー
    // ========================================
    scrollbar: {
      track: { value: '{colors.gray.200}' },
      thumb: { value: '{colors.primary.500}' },
    },

    // ========================================
    // ランディングページ
    // ========================================
    landing: {
      // Feature カード
      featureIndigo: { value: '{colors.indigo.500}' },
      featureIndigoBg: { value: '{colors.indigo.50}' },
      // CTA セクション
      ctaBg: { value: '{colors.primary.500}' },
      ctaSubtext: { value: '{colors.primary.100}' },
      // Footer
      footerBg: { value: '{colors.gray.800}' },
      footerText: { value: '{colors.gray.400}' },
      // システムバッジ
      sysGreenBg: { value: '{colors.green.50}' },
      sysGreenText: { value: '{colors.green.700}' },
      sysBlueBg: { value: '{colors.blue.50}' },
      sysBlueText: { value: '{colors.blue.800}' },
      sysPurpleBg: { value: '#F3E8FF' },
      sysPurpleText: { value: '{colors.purple.600}' },
      sysPinkBg: { value: '{colors.pink.50}' },
      sysPinkText: { value: '{colors.pink.700}' },
      sysOrangeBg: { value: '{colors.orange.100}' },
      sysOrangeText: { value: '{colors.orange.800}' },
    },
  },

  shadows: {
    // ========================================
    // 汎用シャドウ
    // ========================================
    sm: {
      value: '0 1px 2px rgba(0, 0, 0, 0.05)',
    },
    md: {
      value: '0 1px 3px rgba(0, 0, 0, 0.10)',
    },
    lg: {
      value: '0 4px 6px rgba(0, 0, 0, 0.10)',
    },
    xl: {
      value: '0 8px 16px rgba(0, 0, 0, 0.15)',
    },

    // ========================================
    // コンポーネント別シャドウ
    // ========================================
    // ボタン
    button: {
      primary: { value: '0 2px 4px rgba(16, 185, 129, 0.25)' },
      secondary: { value: '0 1px 3px rgba(0, 0, 0, 0.10)' },
      destructive: { value: '0 2px 4px rgba(239, 68, 68, 0.25)' },
    },
    // カード
    card: {
      default: { value: '0 4px 16px rgba(0, 0, 0, 0.06)' },
      hover: { value: '0 8px 24px rgba(0, 0, 0, 0.10)' },
    },
    // ヘッダー
    header: {
      default: { value: '0 2px 8px rgba(0, 0, 0, 0.05)' },
    },
    // サブヘッダー（グローバルヘッダー直下のパネル用、下方向のみの影）
    subHeader: {
      default: { value: '0 4px 8px -4px rgba(0, 0, 0, 0.08)' },
    },
    // 検索パネル
    panel: {
      default: { value: '0 4px 16px rgba(0, 0, 0, 0.04)' },
    },
    // ドロップダウン/メニュー
    menu: {
      default: { value: '0 4px 16px rgba(0, 0, 0, 0.08)' },
    },
    // トースト
    toast: {
      default: { value: '0 4px 12px rgba(0, 0, 0, 0.08)' },
    },
    // ダイアログ
    dialog: {
      default: { value: '0 8px 24px rgba(0, 0, 0, 0.12)' },
    },
    // 入力フィールド（チェックボックス等）
    input: {
      default: { value: '0 1px 2px rgba(0, 0, 0, 0.08)' },
    },
    // スライダーつまみ
    slider: {
      thumb: { value: '0 1px 3px rgba(0, 0, 0, 0.19)' },
    },
    // スイッチつまみ
    switch: {
      thumb: { value: '0 1px 2px rgba(0, 0, 0, 0.12)' },
    },
    // FAB
    fab: {
      default: { value: '0 4px 12px rgba(16, 185, 129, 0.25)' },
    },
    // スクロールボタン
    scrollButton: {
      default: { value: '0 2px 8px rgba(0, 0, 0, 0.08)' },
    },
    // ランディングページ
    landing: {
      // ブラウズボタン
      browseBtn: { value: '0 2px 8px rgba(0, 0, 0, 0.06)' },
      // CTAボタン（Hero）
      heroCta: { value: '0 4px 12px rgba(16, 185, 129, 0.19)' },
      // Feature カード
      featureCard: { value: '0 4px 16px rgba(0, 0, 0, 0.04)' },
      // CTAボタン（白背景）
      ctaBtn: { value: '0 4px 12px rgba(0, 0, 0, 0.12)' },
    },
  },
};
