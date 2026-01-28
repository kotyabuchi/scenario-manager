import { css } from '@/styled-system/css';

// ========================================
// Layout (共通)
// ========================================

export const bodyStyle = css({
  minH: '100vh',
  bg: 'linear-gradient(180deg, {colors.bg.subtle}, {colors.bg.base})',
});

// ========================================
// ランディングページ - Pencilデザイン準拠
// ========================================

// ページ全体
export const page = css({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100dvh',
  bg: 'white',
});

// ========================================
// Hero Section
// ========================================
export const heroSection = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '32px',
  padding: '120px 80px 80px 80px',
  minHeight: '600px',
});

export const heroContent = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '24px',
  maxWidth: '800px',
  width: '100%',
});

export const heroLogo = css({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
});

export const heroLogoIcon = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '48px',
  height: '48px',
  borderRadius: '12px',
  bg: 'primary.100',
});

export const heroLogoText = css({
  fontSize: '32px',
  fontWeight: '700',
  color: 'primary.default',
});

export const heroCatch = css({
  fontSize: '48px',
  fontWeight: '700',
  color: 'gray.800',
  textAlign: 'center',
});

export const heroSub = css({
  fontSize: '18px',
  fontWeight: 'normal',
  color: 'gray.500',
  textAlign: 'center',
});

export const heroCTA = css({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  flexWrap: 'wrap',
  justifyContent: 'center',
});

export const browseBtn = css({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  height: '56px',
  padding: '0 32px',
  borderRadius: '12px',
  bg: 'white',
  shadow: 'landing.browseBtn',
  cursor: 'pointer',
  transition: 'all {durations.fast} ease-out',
  _hover: {
    shadow: 'md',
  },
});

export const browseBtnIcon = css({
  color: 'gray.500',
});

export const browseBtnText = css({
  fontSize: '16px',
  fontWeight: '600',
  color: 'gray.500',
});

export const heroCTABtn = css({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  height: '56px',
  padding: '0 32px',
  borderRadius: '12px',
  bg: 'primary.default',
  shadow: 'landing.heroCta',
  cursor: 'pointer',
  transition: 'all {durations.fast} ease-out',
  _hover: {
    bg: 'primary.hover',
  },
});

export const heroCTABtnIcon = css({
  color: 'white',
});

export const heroCTABtnText = css({
  fontSize: '16px',
  fontWeight: '600',
  color: 'white',
});

// ========================================
// Features Section
// ========================================
export const featuresSection = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '48px',
  padding: '80px 0',
  overflow: 'hidden',
});

export const featuresTitle = css({
  fontSize: '32px',
  fontWeight: '700',
  color: 'gray.800',
});

export const featuresGrid = css({
  display: 'flex',
  gap: '24px',
  overflowX: 'auto',
  maxWidth: '100%',
  px: '24px',
  pb: '8px',
  // Hide scrollbar but keep functionality
  scrollbarWidth: 'none',
  '&::-webkit-scrollbar': {
    display: 'none',
  },
});

export const featureCard = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  width: '280px',
  padding: '24px',
  borderRadius: '16px',
  bg: 'white',
  shadow: 'landing.featureCard',
});

export const featureIcon = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '48px',
  height: '48px',
  borderRadius: '12px',
});

// Feature icon variants (with background colors)
export const featureIcon_search = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '48px',
  height: '48px',
  borderRadius: '12px',
  bg: 'primary.50',
});

export const featureIcon_calendar = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '48px',
  height: '48px',
  borderRadius: '12px',
  bg: 'indigo.50',
});

export const featureIcon_star = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '48px',
  height: '48px',
  borderRadius: '12px',
  bg: 'orange.100',
});

export const featureIcon_shield = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '48px',
  height: '48px',
  borderRadius: '12px',
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
  fontSize: '18px',
  fontWeight: '600',
  color: 'gray.800',
});

export const featureDesc = css({
  fontSize: '14px',
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
  gap: '48px',
  padding: '80px 120px',
  bg: 'gray.50',
});

export const howtoTitle = css({
  fontSize: '32px',
  fontWeight: '700',
  color: 'gray.800',
});

export const howtoSteps = css({
  display: 'flex',
  gap: '48px',
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
  gap: '16px',
  width: '280px',
});

export const stepNum = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '48px',
  height: '48px',
  borderRadius: '24px',
  bg: 'primary.default',
});

export const stepNumText = css({
  fontSize: '20px',
  fontWeight: '700',
  color: 'white',
});

export const stepTitle = css({
  fontSize: '18px',
  fontWeight: '600',
  color: 'gray.800',
});

export const stepDesc = css({
  fontSize: '14px',
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
  gap: '32px',
  padding: '80px 120px',
});

export const systemsTitle = css({
  fontSize: '32px',
  fontWeight: '700',
  color: 'gray.800',
});

export const systemsSub = css({
  fontSize: '16px',
  fontWeight: 'normal',
  color: 'gray.500',
  textAlign: 'center',
});

export const systemsGrid = css({
  display: 'flex',
  justifyContent: 'center',
  gap: '16px',
  flexWrap: 'wrap',
});

export const systemBadge = css({
  display: 'flex',
  alignItems: 'center',
  padding: '8px 16px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '500',
});

// System badge variants (with colors)
export const systemBadge_coc = css({
  display: 'flex',
  alignItems: 'center',
  padding: '8px 16px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '500',
  bg: 'green.50',
  color: 'green.700',
});

export const systemBadge_sw = css({
  display: 'flex',
  alignItems: 'center',
  padding: '8px 16px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '500',
  bg: 'blue.50',
  color: 'blue.800',
});

export const systemBadge_insane = css({
  display: 'flex',
  alignItems: 'center',
  padding: '8px 16px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '500',
  bg: '#F3E8FF',
  color: 'purple.600',
});

export const systemBadge_shinobigami = css({
  display: 'flex',
  alignItems: 'center',
  padding: '8px 16px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '500',
  bg: 'pink.50',
  color: 'pink.700',
});

export const systemBadge_emochloa = css({
  display: 'flex',
  alignItems: 'center',
  padding: '8px 16px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '500',
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
  gap: '24px',
  padding: '80px 120px',
  bg: 'primary.default',
});

export const ctaTitle = css({
  fontSize: '32px',
  fontWeight: '700',
  color: 'white',
});

export const ctaSub = css({
  fontSize: '16px',
  fontWeight: 'normal',
  color: 'primary.100',
});

export const ctaBtn = css({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  height: '56px',
  padding: '0 32px',
  borderRadius: '12px',
  bg: 'white',
  shadow: 'landing.ctaBtn',
  cursor: 'pointer',
  transition: 'all {durations.fast} ease-out',
  _hover: {
    shadow: 'xl',
  },
});

export const ctaBtnIcon = css({
  color: 'primary.default',
});

export const ctaBtnText = css({
  fontSize: '16px',
  fontWeight: '600',
  color: 'primary.default',
});

// ========================================
// Footer
// ========================================
export const footer = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '24px',
  padding: '48px 120px',
  bg: 'gray.800',
});

export const footerLogo = css({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
});

export const footerLogoIcon = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  bg: 'gray.700',
});

export const footerLogoText = css({
  fontSize: '16px',
  fontWeight: '600',
  color: 'white',
});

export const footerCopy = css({
  fontSize: '12px',
  fontWeight: 'normal',
  color: 'gray.400',
});
