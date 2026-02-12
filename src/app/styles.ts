import { css } from '@/styled-system/css';

// ========================================
// Layout (共通)
// ========================================

export const bodyStyle = css({
  minH: '[100vh]',
  bg: '[linear-gradient(180deg, {colors.bg.subtle}, {colors.bg.base})]',
});

// ========================================
// ランディングページ - Pencilデザイン準拠
// ========================================

// ページ全体
export const page = css({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '[100dvh]',
  bg: 'white',
});

// ========================================
// Hero Section
// ========================================
export const heroSection = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8',
  px: '6',
  pt: '16',
  pb: '12',
  md: {
    px: '20',
    pt: '[120px]',
    pb: '20',
    minHeight: '[600px]',
  },
});

export const heroContent = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '6',
  maxWidth: '[800px]',
  width: 'full',
});

export const heroLogo = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
});

export const heroLogoIcon = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '12',
  height: '12',
  borderRadius: 'xl',
  bg: 'primary.100',
});

export const heroLogoText = css({
  fontSize: '[24px]',
  fontWeight: 'bold',
  color: 'primary.default',
  md: {
    fontSize: '[32px]',
  },
});

export const heroCatch = css({
  fontSize: '[28px]',
  fontWeight: 'bold',
  color: 'gray.800',
  textAlign: 'center',
  md: {
    fontSize: '[48px]',
  },
});

export const heroSub = css({
  fontSize: '[18px]',
  fontWeight: 'normal',
  color: 'gray.500',
  textAlign: 'center',
});

export const heroCTA = css({
  display: 'flex',
  alignItems: 'center',
  gap: '4',
  flexWrap: 'wrap',
  justifyContent: 'center',
});

export const browseBtn = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  height: '[48px]',
  padding: '[0 24px]',
  md: {
    height: '[56px]',
    padding: '[0 32px]',
  },
  borderRadius: 'xl',
  bg: 'white',
  shadow: 'landing.browseBtn',
  cursor: 'pointer',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  transitionTimingFunction: 'ease-out',
  _hover: {
    shadow: 'md',
  },
});

export const browseBtnIcon = css({
  color: 'gray.500',
});

export const browseBtnText = css({
  fontSize: '[16px]',
  fontWeight: 'semibold',
  color: 'gray.500',
});

export const heroCTABtn = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  height: '[48px]',
  padding: '[0 24px]',
  md: {
    height: '[56px]',
    padding: '[0 32px]',
  },
  borderRadius: 'xl',
  bg: 'primary.default',
  shadow: 'landing.heroCta',
  cursor: 'pointer',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  transitionTimingFunction: 'ease-out',
  _hover: {
    bg: 'primary.hover',
  },
});

export const heroCTABtnIcon = css({
  color: 'white',
});

export const heroCTABtnText = css({
  fontSize: '[16px]',
  fontWeight: 'semibold',
  color: 'white',
});

// ========================================
// Features Section
// ========================================
export const featuresSection = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8',
  py: '12',
  overflow: 'hidden',
  md: {
    gap: '12',
    py: '20',
  },
});

export const featuresTitle = css({
  fontSize: '[24px]',
  fontWeight: 'bold',
  color: 'gray.800',
  md: {
    fontSize: '[32px]',
  },
});

export const featuresGrid = css({
  display: 'flex',
  gap: '6',
  overflowX: 'auto',
  maxWidth: 'full',
  px: '6',
  pb: '2',
  // Hide scrollbar but keep functionality
  scrollbarWidth: '[none]',
  '&::-webkit-scrollbar': {
    display: 'none',
  },
});

export const featureCard = css({
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
  gap: '4',
  width: '[240px]',
  padding: '4',
  bg: 'white',
  md: {
    width: '[280px]',
    padding: '6',
  },
});

export const featureIcon = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '12',
  height: '12',
  borderRadius: 'xl',
});

// Feature icon variants (with background colors)
export const featureIcon_search = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '12',
  height: '12',
  borderRadius: 'xl',
  bg: 'primary.50',
});

export const featureIcon_calendar = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '12',
  height: '12',
  borderRadius: 'xl',
  bg: 'indigo.50',
});

export const featureIcon_star = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '12',
  height: '12',
  borderRadius: 'xl',
  bg: 'orange.100',
});

export const featureIcon_shield = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '12',
  height: '12',
  borderRadius: 'xl',
  bg: 'red.100',
});

// Icon colors
export const iconColor_primary = css({
  color: 'primary.default',
});

export const iconColor_indigo = css({
  color: 'indigo.500',
});

export const iconColor_orange = css({
  color: 'orange.500',
});

export const iconColor_red = css({
  color: 'red.500',
});

export const featureTitle = css({
  fontSize: '[18px]',
  fontWeight: 'semibold',
  color: 'gray.800',
});

export const featureDesc = css({
  fontSize: '[14px]',
  fontWeight: 'normal',
  color: 'gray.500',
  whiteSpace: 'pre-line',
});

// ========================================
// How to Use Section
// ========================================
export const howtoSection = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8',
  px: '6',
  py: '12',
  bg: 'gray.50',
  md: {
    gap: '12',
    px: '[120px]',
    py: '20',
  },
});

export const howtoTitle = css({
  fontSize: '[24px]',
  fontWeight: 'bold',
  color: 'gray.800',
  md: {
    fontSize: '[32px]',
  },
});

export const howtoSteps = css({
  display: 'flex',
  gap: '12',
  justifyContent: 'center',
  // Stack vertically on smaller screens
  flexDirection: 'column',
  alignItems: 'center',
  md: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});

export const stepCard = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4',
  width: '[280px]',
});

export const stepNum = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '12',
  height: '12',
  borderRadius: 'full',
  bg: 'primary.default',
});

export const stepNumText = css({
  fontSize: '[20px]',
  fontWeight: 'bold',
  color: 'white',
});

export const stepTitle = css({
  fontSize: '[18px]',
  fontWeight: 'semibold',
  color: 'gray.800',
});

export const stepDesc = css({
  fontSize: '[14px]',
  fontWeight: 'normal',
  color: 'gray.500',
  textAlign: 'center',
  whiteSpace: 'pre-line',
});

// ========================================
// Systems Section
// ========================================
export const systemsSection = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '6',
  px: '6',
  py: '12',
  md: {
    gap: '8',
    px: '[120px]',
    py: '20',
  },
});

export const systemsTitle = css({
  fontSize: '[24px]',
  fontWeight: 'bold',
  color: 'gray.800',
  md: {
    fontSize: '[32px]',
  },
});

export const systemsSub = css({
  fontSize: '[16px]',
  fontWeight: 'normal',
  color: 'gray.500',
  textAlign: 'center',
});

export const systemsGrid = css({
  display: 'flex',
  justifyContent: 'center',
  gap: '4',
  flexWrap: 'wrap',
});

export const systemBadge = css({
  display: 'flex',
  alignItems: 'center',
  py: '2',
  px: '4',
  borderRadius: 'xl',
  fontSize: '[14px]',
  fontWeight: 'medium',
});

// System badge variants (with colors)
export const systemBadge_coc = css({
  display: 'flex',
  alignItems: 'center',
  py: '2',
  px: '4',
  borderRadius: 'xl',
  fontSize: '[14px]',
  fontWeight: 'medium',
  bg: 'green.50',
  color: 'green.700',
});

export const systemBadge_sw = css({
  display: 'flex',
  alignItems: 'center',
  py: '2',
  px: '4',
  borderRadius: 'xl',
  fontSize: '[14px]',
  fontWeight: 'medium',
  bg: 'blue.50',
  color: 'blue.800',
});

export const systemBadge_insane = css({
  display: 'flex',
  alignItems: 'center',
  py: '2',
  px: '4',
  borderRadius: 'xl',
  fontSize: '[14px]',
  fontWeight: 'medium',
  bg: '[#F3E8FF]',
  color: 'purple.600',
});

export const systemBadge_shinobigami = css({
  display: 'flex',
  alignItems: 'center',
  py: '2',
  px: '4',
  borderRadius: 'xl',
  fontSize: '[14px]',
  fontWeight: 'medium',
  bg: 'pink.50',
  color: 'pink.700',
});

export const systemBadge_emochloa = css({
  display: 'flex',
  alignItems: 'center',
  py: '2',
  px: '4',
  borderRadius: 'xl',
  fontSize: '[14px]',
  fontWeight: 'medium',
  bg: 'orange.100',
  color: 'orange.800',
});

// ========================================
// CTA Section
// ========================================
export const ctaSection = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '6',
  px: '6',
  py: '12',
  bg: 'primary.default',
  md: {
    px: '[120px]',
    py: '20',
  },
});

export const ctaTitle = css({
  fontSize: '[24px]',
  fontWeight: 'bold',
  color: 'white',
  md: {
    fontSize: '[32px]',
  },
});

export const ctaSub = css({
  fontSize: '[16px]',
  fontWeight: 'normal',
  color: 'primary.100',
});

export const ctaBtn = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  height: '[48px]',
  padding: '[0 24px]',
  md: {
    height: '[56px]',
    padding: '[0 32px]',
  },
  borderRadius: 'xl',
  bg: 'white',
  shadow: 'landing.ctaBtn',
  cursor: 'pointer',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  transitionTimingFunction: 'ease-out',
  _hover: {
    shadow: 'xl',
  },
});

export const ctaBtnIcon = css({
  color: 'primary.default',
});

export const ctaBtnText = css({
  fontSize: '[16px]',
  fontWeight: 'semibold',
  color: 'primary.default',
});

// ========================================
// Footer
// ========================================
export const footer = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '6',
  px: '6',
  py: '10',
  bg: 'gray.800',
  md: {
    px: '[120px]',
    py: '12',
  },
});

export const footerLogo = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
});

export const footerLogoIcon = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '8',
  height: '8',
  borderRadius: 'xl',
  bg: 'gray.700',
});

export const footerLogoText = css({
  fontSize: '[16px]',
  fontWeight: 'semibold',
  color: 'white',
});

export const footerCopy = css({
  fontSize: '[12px]',
  fontWeight: 'normal',
  color: 'gray.400',
});
