import { css } from '@/styled-system/css';

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
  transition: 'all 0.15s ease-out',
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
  transition: 'all 0.15s ease-out',
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
  padding: '80px 120px',
});

export const featuresTitle = css({
  fontSize: '32px',
  fontWeight: '700',
  color: 'gray.800',
});

export const featuresGrid = css({
  display: 'flex',
  justifyContent: 'center',
  gap: '24px',
  flexWrap: 'wrap',
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
  flexWrap: 'wrap',
  justifyContent: 'center',
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
  transition: 'all 0.15s ease-out',
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
