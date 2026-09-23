export const semanticTokens = {
  colors: {
    // ========================================
    // 背景色
    // ========================================
    bg: {
      // ページ背景（淡い青みがかった白）
      page: { value: '{colors.canvas}' },
      // カード・パネル背景（純白ではなく僅かに緑みのある白）
      card: { value: '{colors.paper}' },
      // 入力フィールド背景
      input: { value: '{colors.gray.100}' },
      // 無効状態の背景
      disabled: { value: '{colors.gray.200}' },
      // エラー入力背景
      error: { value: '{colors.red.50}' },
      // 成功/選択状態背景
      success: { value: '{colors.green.50}' },
      // 警告背景
      warning: { value: '{colors.yellow.100}' },
    },

    // ========================================
    // テキスト色
    // ========================================
    text: {
      // タイトル・見出し
      title: { value: '{colors.gray.900}' },
      // 本文・ラベル（タイトルより一段淡く）
      body: { value: '{colors.gray.800}' },
      // サブテキスト・補足
      secondary: { value: '{colors.gray.700}' },
      // プレースホルダー・無効テキスト
      placeholder: { value: '{colors.gray.500}' },
      // 白テキスト（濃い背景上）
      white: { value: '{colors.white}' },
      // エラーテキスト
      error: { value: '{colors.red.500}' },
      // 成功テキスト
      success: { value: '{colors.green.800}' },
      // 警告テキスト
      warning: { value: '{colors.yellow.800}' },
    },

    // ========================================
    // プライマリ（ブランド色 = green のセマンティックエイリアス）
    // base は colors.green。primary.50-900 は緑スケールの別名、
    // primary.default/hover/... は役割。コンポーネントは primary.* を参照する。
    // ========================================
    primary: {
      50: { value: '{colors.green.50}' },
      100: { value: '{colors.green.100}' },
      200: { value: '{colors.green.200}' },
      300: { value: '{colors.green.300}' },
      400: { value: '{colors.green.400}' },
      500: { value: '{colors.green.500}' },
      600: { value: '{colors.green.600}' },
      700: { value: '{colors.green.700}' },
      800: { value: '{colors.green.800}' },
      900: { value: '{colors.green.900}' },
      default: { value: '{colors.green.500}' },
      hover: { value: '{colors.green.600}' },
      active: { value: '{colors.green.700}' },
      subtle: { value: '{colors.green.100}' },
      subtleHover: { value: '{colors.green.50}' },
      text: { value: '{colors.green.800}' },
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
    // 警告（イエロー）
    // ========================================
    warning: {
      default: { value: '{colors.yellow.500}' },
      hover: { value: '{colors.yellow.600}' },
      subtle: { value: '{colors.yellow.100}' },
      text: { value: '{colors.yellow.800}' },
      textOnWarning: { value: '{colors.white}' },
    },

    // ========================================
    // 情報（青）
    // ========================================
    info: {
      default: { value: '{colors.info.500}' },
      hover: { value: '{colors.info.600}' },
      subtle: { value: '{colors.info.100}' },
      text: { value: '{colors.info.800}' },
      textOnInfo: { value: '{colors.white}' },
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
      filled: { value: '{colors.yellow.500}' },
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
      focus: { value: '{colors.green.500}' },
      error: { value: '{colors.red.500}' },
    },

    // ========================================
    // オーバーレイ
    // ========================================
    overlay: {
      light: { value: '{colors.whiteA.85}' },
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
      primary: { value: '{colors.green.500}' },
      error: { value: '{colors.red.500}' },
    },

    // ========================================
    // ボタン
    // ========================================
    button: {
      // Primary Button
      primaryBg: { value: '{colors.green.500}' },
      primaryBgHover: { value: '{colors.green.600}' },
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
      ghostText: { value: '{colors.gray.600}' },
      ghostTextHover: { value: '{colors.gray.700}' },
    },

    // ========================================
    // チップ/タグ
    // ========================================
    chip: {
      // Selectable (緑)
      selectableBg: { value: '{colors.green.100}' },
      selectableText: { value: '{colors.green.800}' },
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
      bgReadonly: { value: '{colors.gray.50}' },
      text: { value: '{colors.gray.800}' },
      placeholder: { value: '{colors.gray.400}' },
      label: { value: '{colors.gray.700}' },
      focusBorder: { value: '{colors.green.500}' },
      errorBorder: { value: '{colors.red.500}' },
    },

    // ========================================
    // スライダー
    // ========================================
    slider: {
      track: { value: '{colors.gray.200}' },
      fill: { value: '{colors.green.500}' },
      thumb: { value: '{colors.white}' },
      valueText: { value: '{colors.green.500}' },
    },

    // ========================================
    // チェックボックス/ラジオ/スイッチ
    // ========================================
    toggle: {
      uncheckedBg: { value: '{colors.white}' },
      checkedBg: { value: '{colors.green.500}' },
      disabledBg: { value: '{colors.gray.200}' },
      switchTrack: { value: '{colors.gray.200}' },
      switchTrackOn: { value: '{colors.green.500}' },
    },

    // ========================================
    // ドロップダウン/メニュー
    // ========================================
    menu: {
      bg: { value: '{colors.white}' },
      itemBg: { value: 'transparent' },
      itemBgHover: { value: '{colors.gray.50}' },
      itemBgSelected: { value: '{colors.green.50}' },
      itemText: { value: '{colors.gray.800}' },
      itemTextSelected: { value: '{colors.green.500}' },
    },

    // ========================================
    // タブ
    // ========================================
    tab: {
      bg: { value: '{colors.gray.100}' },
      activeBg: { value: '{colors.white}' },
      activeText: { value: '{colors.gray.800}' },
      inactiveText: { value: '{colors.gray.500}' },
      underlineActive: { value: '{colors.green.500}' },
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
      successIcon: { value: '{colors.green.500}' },
      successIconBg: { value: '{colors.green.100}' },
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
      activeBg: { value: '{colors.green.500}' },
      activeText: { value: '{colors.white}' },
      inactiveText: { value: '{colors.gray.700}' },
      icon: { value: '{colors.gray.500}' },
    },

    // ========================================
    // バッジ
    // ========================================
    badge: {
      successBg: { value: '{colors.green.100}' },
      successDot: { value: '{colors.green.500}' },
      successText: { value: '{colors.green.800}' },
      warningBg: { value: '{colors.yellow.100}' },
      warningDot: { value: '{colors.yellow.500}' },
      warningText: { value: '{colors.yellow.800}' },
      errorBg: { value: '{colors.red.100}' },
      errorDot: { value: '{colors.red.500}' },
      errorText: { value: '{colors.red.800}' },
      neutralBg: { value: '{colors.gray.100}' },
      neutralDot: { value: '{colors.gray.500}' },
      neutralText: { value: '{colors.gray.700}' },
      // ロールバッジ（白テキスト10pxでWCAG 4.5:1を確保するため700番台を使用）
      keeperBg: { value: '{colors.green.700}' },
      playerBg: { value: '{colors.blue.700}' },
      spectatorBg: { value: '{colors.gray.600}' },
    },

    // ========================================
    // プログレス
    // ========================================
    progress: {
      track: { value: '{colors.gray.200}' },
      fill: { value: '{colors.green.500}' },
      text: { value: '{colors.green.500}' },
      circleBg: { value: '{colors.gray.200}' },
      circleFg: { value: '{colors.white}' },
    },

    // ========================================
    // アバター
    // ========================================
    avatar: {
      bg: { value: '{colors.green.100}' },
      icon: { value: '{colors.green.500}' },
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
      textActive: { value: '{colors.green.500}' },
      logo: { value: '{colors.green.500}' },
      logoBg: { value: '{colors.green.100}' },
    },

    // ========================================
    // カード
    // ========================================
    card: {
      bg: { value: '{colors.paper}' },
    },

    // ========================================
    // サイドバー
    // ========================================
    sidebar: {
      bg: { value: '{colors.white}' },
      toggleBg: { value: '{colors.gray.100}' },
      toggleBgHover: { value: '{colors.gray.200}' },
      toggleIcon: { value: '{colors.gray.600}' },
    },

    // ========================================
    // サイドメニュー（PCグローバルナビ）
    // ========================================
    sideMenu: {
      bg: { value: '{colors.canvas}' },
      brand: { value: '{colors.green.700}' },
      activeItemBg: { value: '{colors.green.50}' },
      activeItemText: { value: '{colors.green.800}' },
      activeItemIcon: { value: '{colors.green.600}' },
      inactiveItemText: { value: '{colors.gray.700}' },
      inactiveItemIcon: { value: '{colors.gray.500}' },
      itemBgHover: { value: '{colors.paper}' },
    },

    // ========================================
    // システムバッジ（TRPGシステム識別用）
    // ========================================
    systemBadge: {
      green: { value: '{colors.green.500}' },
      purple: { value: '{colors.purple.500}' },
      orange: { value: '{colors.orange.500}' },
    },

    // ========================================
    // スクロールバー
    // ========================================
    scrollbar: {
      track: { value: '{colors.transparent}' },
      thumb: { value: '{colors.green.500}' },
    },

    // ========================================
    // ダッシュボード
    // ========================================
    hero: {
      gradient: {
        from: { value: '{colors.green.700}' },
        to: { value: '{colors.green.600}' },
      },
      glass: {
        bg: { value: '{colors.overlay.10}' },
        surface: { value: '{colors.whiteA.10}' },
        border: { value: '{colors.whiteA.20}' },
        text: { value: '{colors.whiteA.90}' },
      },
    },
    notice: {
      bg: { value: '{colors.info.50}' },
      border: { value: '{colors.info.200}' },
    },
  },

  opacity: {
    disabled: { value: '0.5' },
    hover: { value: '0.8' },
    muted: { value: '0.3' },
  },

  borders: {
    focusRing: { value: '2px solid {colors.green.500}' },
    focusRingDashed: { value: '2px dashed {colors.green.500}' },
    soft: { value: '1px solid {colors.gray.100}' },
  },

  shadows: {
    // ========================================
    // 汎用シャドウ
    // ========================================
    sm: {
      value: '0 1px 2px {colors.overlay.5}',
    },
    md: {
      value: '0 1px 3px {colors.overlay.10}',
    },
    lg: {
      value: '0 4px 6px {colors.overlay.10}',
    },
    xl: {
      value: '0 8px 16px {colors.overlay.15}',
    },

    // ========================================
    // コンポーネント別シャドウ
    // ========================================
    // ボタン
    button: {
      primary: { value: '0 2px 4px {colors.greenShadow.25}' },
      primaryHover: { value: '0 4px 14px {colors.greenShadow.30}' },
      secondary: { value: '0 1px 3px {colors.overlay.10}' },
      destructive: { value: '0 2px 4px {colors.redShadow.25}' },
    },
    // カード（影の色は緑寄りに統一。強さは default/hover で変える）
    card: {
      default: { value: '0 4px 16px {colors.greenShadowSoft.12}' },
      hover: { value: '0 8px 24px {colors.greenShadowSoft.18}' },
    },
    // ヘッダー
    header: {
      default: { value: '0 2px 8px {colors.overlay.5}' },
    },
    // サブヘッダー（グローバルヘッダー直下のパネル用、下方向のみの影）
    subHeader: {
      default: { value: '0 4px 8px -4px {colors.overlay.8}' },
    },
    // 検索パネル
    panel: {
      default: { value: '0 4px 16px {colors.overlay.4}' },
    },
    // ドロップダウン/メニュー
    menu: {
      default: { value: '0 4px 16px {colors.overlay.8}' },
    },
    // トースト
    toast: {
      default: { value: '0 4px 12px {colors.overlay.8}' },
    },
    // ダイアログ
    dialog: {
      default: { value: '0 8px 24px {colors.overlay.12}' },
    },
    // 入力フィールド（チェックボックス等）
    input: {
      default: { value: '0 1px 2px {colors.overlay.8}' },
    },
    // スライダーつまみ
    slider: {
      thumb: { value: '0 1px 3px {colors.overlay.19}' },
    },
    // スイッチつまみ
    switch: {
      thumb: { value: '0 1px 2px {colors.overlay.12}' },
    },
    // FAB
    fab: {
      default: { value: '0 4px 12px {colors.greenShadow.25}' },
    },
    // スクロールボタン
    scrollButton: {
      default: { value: '0 2px 8px {colors.overlay.8}' },
    },
    // ランディングページ
    landing: {
      // ブラウズボタン
      browseBtn: { value: '0 2px 8px {colors.overlay.6}' },
      // CTAボタン（Hero）
      heroCta: { value: '0 4px 12px {colors.greenShadow.19}' },
      // Feature カード
      featureCard: { value: '0 4px 16px {colors.overlay.4}' },
      // CTAボタン（白背景）
      ctaBtn: { value: '0 4px 12px {colors.overlay.12}' },
    },
  },
};
