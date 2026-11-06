import { css, cva } from '@/styled-system/css';

// ========================================
// Sub Header アクション（Pencil準拠）
// ========================================
export const subHeader_favBtn = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1.5',
  h: '9',
  px: '3.5',
  py: '2',
  borderRadius: 'lg',
  bg: 'orange.100',
  color: 'orange.800',
  fontSize: '[13px]',
  fontWeight: 'medium',
  cursor: 'pointer',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  border: 'none',
  _hover: {
    bg: 'orange.200',
  },
});

export const subHeader_favIcon = css({
  color: 'orange.500',
});

// ========================================
// シナリオ情報（First View - Pencil準拠）
// ========================================
export const firstView = css({
  display: 'flex',
  gap: '8',
  w: 'full',
});

export const firstView_thumbnail = css({
  position: 'relative',
  w: '[400px]',
  h: '[300px]',
  borderRadius: '2xl',
  overflow: 'hidden',
  bg: 'gray.200',
  shadow: 'card.default',
  flexShrink: '0',
});

export const firstView_thumbnailPlaceholder = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '[400px]',
  h: '[300px]',
  borderRadius: '2xl',
  bg: 'gray.200',
  color: 'gray.400',
  shadow: 'card.default',
  flexShrink: '0',
});

export const firstView_content = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  flex: '1',
});

export const scenarioInfo_top = css({
  display: 'flex',
  alignItems: 'center',
  gap: '4',
});

export const scenarioInfo_system = css({
  display: 'inline-flex',
  alignItems: 'center',
  px: '4',
  py: 'xs',
  bg: 'green.100',
  color: 'green.800',
  fontSize: 'sm',
  fontWeight: 'medium',
  borderRadius: 'md',
});

export const scenarioInfo_rating = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'xs',
});

export const scenarioInfo_ratingStars = css({
  display: 'flex',
  alignItems: 'center',
  gap: '[1px]',
  color: 'orange.400',
});

export const scenarioInfo_ratingText = css({
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'gray.800',
});

export const scenarioInfo_title = css({
  fontSize: '[28px]',
  fontWeight: 'bold',
  color: 'gray.800',
  lineHeight: 'tight',
});

export const scenarioInfo_metaRow = css({
  display: 'flex',
  alignItems: 'center',
  gap: '8',
  flexWrap: 'wrap',
});

export const scenarioInfo_metaItem = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  color: 'gray.500',
  fontSize: 'sm',
});

export const scenarioInfo_metaIcon = css({
  w: '4',
  h: '4',
  color: 'gray.500',
});

export const scenarioInfo_tags = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
});

export const scenarioInfo_tag = css({
  px: '4',
  py: 'xs',
  fontSize: 'xs',
  bg: 'gray.200',
  borderRadius: 'full',
  color: 'gray.700',
});

export const scenarioInfo_description = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
});

export const scenarioInfo_descText = css({
  fontSize: 'sm',
  color: 'gray.600',
  lineHeight: '[1.6]',
  whiteSpace: 'pre-wrap',
});

export const scenarioInfo_readMore = css({
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'primary.700',
  cursor: 'pointer',
  _hover: {
    textDecoration: 'underline',
  },
});

export const scenarioInfo_distributeBtn = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'xs',
  w: '[max-content]',
  px: '4',
  py: '2',
  borderRadius: 'md',
  bg: 'primary.500',
  color: 'white',
  fontSize: 'xs',
  fontWeight: 'medium',
  shadow: 'button.primary',
  textDecoration: 'none',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _hover: {
    bg: 'primary.600',
    transform: 'translateY(-1px)',
  },
});

// ソース情報バッジ
export const scenarioInfo_sourceInfo = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
});

export const scenarioInfo_sourceBadge = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
  px: '2',
  py: '0.5',
  borderRadius: 'md',
  bg: 'primary.50',
  color: 'primary.800',
  fontSize: '[12px]',
  fontWeight: 'medium',
});

// ========================================
// セクション共通（Pencil準拠）
// ========================================
export const section = css({
  w: 'full',
});

export const section_title = css({
  fontSize: 'lg',
  fontWeight: 'bold',
  color: 'text.body',
  mb: 'md',
});

export const section_header = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  mb: 'lg',
  // タイトル(h2)自身の下マージンを打ち消して上下中央揃えを成立させる
  '& h2': { mb: '0' },
});

export const section_headerActions = css({
  display: 'flex',
  alignItems: 'center',
  gap: '4',
});

export const section_count = css({
  fontSize: 'sm',
  color: 'gray.600',
  ml: 'sm',
});

export const section_empty = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4',
  py: '8',
  textAlign: 'center',
  color: 'gray.600',
  fontSize: 'sm',
});

export const section_emptyText = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'xs',
});

export const section_ctaButton = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'xs',
  px: '6',
  py: '2',
  bg: 'primary.500',
  color: 'white',
  fontSize: 'sm',
  fontWeight: 'medium',
  borderRadius: 'lg',
  textDecoration: 'none',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _hover: {
    bg: 'primary.600',
    transform: 'translateY(-1px)',
  },
});

export const section_actionButton = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'xs',
  px: '4',
  py: 'xs',
  bg: 'primary.500',
  color: 'white',
  fontSize: 'sm',
  fontWeight: 'medium',
  borderRadius: 'md',
  border: 'none',
  cursor: 'pointer',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _hover: {
    bg: 'primary.600',
  },
});

// ========================================
// 横スクロールセクション（Pencil準拠）
// ========================================
export const horizontalSection = css({
  position: 'relative',
  w: 'full',
});

export const horizontalScroll = css({
  display: 'flex',
  gap: '4',
  overflowX: 'auto',
  pb: 'md',
  scrollbarWidth: '[none]',
  _scrollbar: {
    display: 'none',
  },
});

export const horizontalScroll_fade = css({
  position: 'absolute',
  top: '[45px]',
  right: '0',
  w: '[80px]',
  h: '[calc(100% - 45px - 24px)]',
  background: '[linear-gradient(to right, transparent, token(colors.bg.page))]',
  pointerEvents: 'none',
});

export const horizontalScroll_btn = css({
  position: 'absolute',
  top: '[50%]',
  right: '0',
  transform: 'translateY(-50%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '10',
  h: '10',
  borderRadius: 'full',
  bg: 'white',
  shadow: 'scrollButton.default',
  color: 'gray.500',
  cursor: 'pointer',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  border: 'none',
  _hover: {
    shadow: 'card.hover',
    color: 'gray.700',
  },
});

export const horizontalScroll_track = css({
  w: 'full',
  h: '1.5',
  bg: 'gray.200',
  borderRadius: 'sm',
  mt: 'sm',
});

export const horizontalScroll_thumb = css({
  h: '1.5',
  bg: 'primary.500',
  borderRadius: 'sm',
});

// ========================================
// セッション行（モック準拠: バッジ＋卓名＋詳細を見る＋メタ行）
// ========================================
export const sessionList = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
});

export const sessionRow = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
});

// リスト内アイテムの区切り線（セクション区切りの divider より軽量）
export const listDivider = css({
  border: 'none',
  h: '[1px]',
  w: 'full',
  bg: 'paperBorder.100',
  m: '0',
});

export const sessionRow_top = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
});

// 卓名（セッション詳細へのリンク。当たり判定は文字列幅のみ）
export const sessionRow_name = css({
  minWidth: '0',
  fontSize: 'sm',
  fontWeight: 'semibold',
  color: 'text.body',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  textDecoration: 'none',
  _hover: {
    textDecoration: 'underline',
  },
});

// ユーザーページへのリンク（メタ行内の名前用・動画/セッション共用）
export const userLink = css({
  color: '[inherit]',
  textDecoration: 'none',
  _hover: {
    color: 'text.body',
    textDecoration: 'underline',
  },
});

export const sessionRow_meta = css({
  display: 'flex',
  flexWrap: 'wrap',
  columnGap: '4',
  rowGap: '1',
  fontSize: 'xs',
  color: 'text.secondary',
});

export const sessionRow_metaItem = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1',
});

// ========================================
// 動画行（モック準拠: 小サムネ左＋タイトル・投稿者のコンパクトリスト）
// ========================================
export const videoList = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
});

export const videoRow = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
});

// サムネイル全面のリンク（ネタバレ解除後のみ表示）
export const videoRow_thumbnailLink = css({
  position: 'relative',
  display: 'block',
  width: 'full',
  height: 'full',
});

// スクリーンリーダー専用テキスト
export const srOnly = css({
  srOnly: true,
});

export const videoRow_thumbnail = css({
  position: 'relative',
  width: '[120px]',
  aspectRatio: '[16/9]',
  borderRadius: 'md',
  overflow: 'hidden',
  bg: 'gray.800',
  flexShrink: '0',
});

export const videoRow_playIcon = css({
  position: 'absolute',
  top: '[50%]',
  left: '[50%]',
  transform: 'translate(-50%, -50%)',
  color: '[white/50]',
});

export const videoRow_spoilerOverlay = css({
  position: 'absolute',
  inset: '0',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1',
  bg: 'overlay.dark',
  backdropFilter: '[blur(8px)]',
  color: 'white',
  fontSize: '[10px]',
  cursor: 'pointer',
  transitionProperty: '[opacity]',
  transitionDuration: 'fast',
  border: 'none',
  width: 'full',
  height: 'full',
  _hover: {
    opacity: '[hover]',
  },
});

export const videoRow_placeholder = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 'full',
  height: 'full',
  bg: 'gray.700',
  color: '[white/50]',
});

export const videoRow_info = css({
  flex: '1',
  minWidth: '0',
});

export const videoRow_title = css({
  // 当たり判定を文字列幅に一致させる（blockだと行幅いっぱいになる）
  display: 'inline-block',
  maxWidth: 'full',
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'text.body',
  lineHeight: 'snug',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  textDecoration: 'none',
  _hover: {
    textDecoration: 'underline',
  },
});

export const videoRow_meta = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1.5',
  mt: '1',
  color: 'text.secondary',
  fontSize: 'xs',
});

export const video_thumbnailImage = css({
  objectFit: 'cover',
});

// ========================================
// レビューセクション（Pencil準拠）
// ========================================
export const reviewsHeader = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  columnGap: '4',
  rowGap: '2',
  mb: 'md',
  // タイトル(h2)自身の下マージンを打ち消して上下中央揃えを成立させる
  '& h2': { mb: '0' },
});

export const reviewsControls = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  columnGap: '4',
  rowGap: '2',
  mb: 'md',
  // ラベル内では折り返さず、コントロール単位で折り返す
  whiteSpace: 'nowrap',
});

// 並び順Selectの幅を内容に合わせて絞るラッパー
export const reviewsSort = css({
  w: '36',
});

export const reviewFilter = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '4',
  mb: 'lg',
  p: '4',
  bg: 'gray.50',
  borderRadius: 'lg',
});

export const reviewFilter_sortTabs = css({
  display: 'flex',
  gap: 'xs',
});

export const reviewFilter_sortTabButton = cva({
  base: {
    px: '4',
    py: 'xs',
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'gray.400',
    bg: 'transparent',
    border: 'none',
    borderRadius: 'md',
    cursor: 'pointer',
    transitionProperty: 'common',
    transitionDuration: 'fast',
    _hover: {
      color: 'gray.600',
      bg: 'gray.100',
    },
  },
  variants: {
    active: {
      true: {
        color: 'primary.600',
        bg: 'white',
        fontWeight: 'bold',
        shadow: 'sm',
        _hover: {
          color: 'primary.600',
          bg: 'white',
        },
      },
    },
  },
});

export const reviewFilter_toggle = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'xs',
  fontSize: 'sm',
  color: 'gray.500',
  cursor: 'pointer',
  _hover: {
    color: 'gray.700',
  },
});

export const reviewList = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
});

// ========================================
// レビューカード（Pencil準拠）
// ========================================
export const reviewCard = css({
  w: 'full',
});

export const reviewCard_hidden = css({
  opacity: '[0.5]',
});

export const reviewCard_header = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  w: 'full',
});

export const reviewCard_left = css({
  display: 'flex',
  alignItems: 'center',
  gap: '4',
});

export const reviewCard_stars = css({
  display: 'flex',
  alignItems: 'center',
  gap: '[2px]',
  color: 'orange.400',
});

export const reviewCard_starEmpty = css({
  color: 'gray.200',
});

export const reviewCard_ratingValue = css({
  fontSize: 'md',
  fontWeight: 'semibold',
  color: 'gray.900',
});

export const reviewCard_actions = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
});

export const reviewCard_actionText = css({
  fontSize: 'xs',
  color: 'gray.700',
  cursor: 'pointer',
  _hover: {
    color: 'gray.800',
  },
});

export const reviewCard_userInfo = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  mt: 'md',
});

// 名前＋@ハンドルのグループ（全体がユーザーページへのリンク）。
// インライン整列で自然にベースラインが揃う。下線は内側の単一インラインspanに
// 引くことで、名前と@ハンドルの間隔も含めて1本に連続させる
export const reviewCard_nameGroup = css({
  // ハーフレディングを刈り取り、アバターに対して光学中央揃え
  textTrim: true,
  textDecoration: 'none',
  _hover: {
    '& > span': {
      textDecoration: 'underline',
    },
  },
});

export const reviewCard_avatar = css({
  w: '8',
  h: '8',
  borderRadius: 'full',
  bg: 'gray.200',
  overflow: 'hidden',
});

export const reviewCard_avatarPlaceholder = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '8',
  h: '8',
  borderRadius: 'full',
  bg: 'gray.200',
  color: 'gray.500',
  fontSize: 'xs',
});

export const reviewCard_userName = css({
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'gray.900',
});

export const reviewCard_handle = css({
  fontSize: 'xs',
  color: 'gray.600',
  // 名前との間隔4px（inlineのためgapではなくmarginで確保）
  ml: '1',
});

export const reviewCard_date = css({
  fontSize: 'xs',
  color: 'gray.600',
  // モック準拠: ユーザー情報行の右端に寄せる
  ml: 'auto',
});

export const reviewCard_content = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  mt: 'md',
});

export const reviewCard_commentText = css({
  fontSize: 'sm',
  color: 'gray.700',
  lineHeight: '[1.6]',
  whiteSpace: 'pre-wrap',
});

export const reviewCard_spoilerToggle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  color: 'primary.500',
  fontSize: 'sm',
  fontWeight: 'medium',
  cursor: 'pointer',
  _hover: {
    textDecoration: 'underline',
  },
  // 開閉状態でキャレットを回転（data-expanded はコンポーネント側で付与）。
  // 小さな機能フィードバックのため、Selectのインジケーターと同様に
  // prefers-reduced-motion でも回転させる
  '& svg': {
    transitionProperty: '[transform]',
    transitionDuration: 'fast',
    transitionTimingFunction: 'ease-out',
  },
  '&[data-expanded] svg': {
    transform: 'rotate(180deg)',
  },
});

export const reviewCard_spoilerContent = css({
  mt: 'sm',
  fontSize: 'sm',
  color: 'gray.700',
  lineHeight: '[1.6]',
  whiteSpace: 'pre-wrap',
});

export const reviewCard_user = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
});

export const reviewCard_userInfo_text = css({
  display: 'flex',
  flexDirection: 'column',
});

export const reviewCard_nickname = css({
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'gray.900',
});

export const reviewCard_username = css({
  fontSize: 'xs',
  color: 'gray.500',
});

export const reviewCard_rating = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  mb: 'sm',
});

export const reviewCard_openComment = css({
  fontSize: 'sm',
  color: 'gray.700',
  lineHeight: '[1.6]',
  whiteSpace: 'pre-wrap',
});

export const reviewCard_spoiler = css({
  mt: 'md',
});

export const reviewCard_hiddenMessage = css({
  fontSize: 'sm',
  color: 'gray.600',
  fontStyle: 'italic',
});

export const reviewCard_actionButton = css({
  p: 'xs',
  color: 'gray.500',
  borderRadius: 'md',
  cursor: 'pointer',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _hover: {
    bg: 'gray.100',
    color: 'gray.700',
  },
});

// ========================================
// もっと見るボタン
// ========================================
export const loadMore = css({
  display: 'flex',
  justifyContent: 'center',
  mt: 'lg',
});

// ========================================
// 区切り線
// ========================================
export const divider = css({
  border: 'none',
  h: '[1px]',
  bg: 'gray.200',
  my: '8',
});

export const review_avatarImage = css({
  objectFit: 'cover',
});
