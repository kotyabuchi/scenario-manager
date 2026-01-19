import { css } from '@/styled-system/css';

// ページコンテナ
export const pageContainer = css({
  minH: '100vh',
  display: 'flex',
  flexDirection: 'column',
});

// ヒーローセクション
export const hero = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  px: '24px',
  py: '80px',
  textAlign: 'center',
  gap: '24px',
  md: {
    py: '100px',
    gap: '32px',
  },
});

export const heroTitle = css({
  fontSize: '4xl',
  fontWeight: 'bold',
  color: 'text.primary',
  lineHeight: 'tight',
  textWrap: 'balance',
  animation: 'fadeIn 0.8s ease forwards',
  md: {
    fontSize: '5xl',
  },
});

export const heroSubtitle = css({
  fontSize: 'lg',
  color: 'text.secondary',
  lineHeight: 'relaxed',
  maxW: '600px',
  textWrap: 'balance',
  animation: 'fadeIn 0.8s ease forwards',
  animationDelay: '0.2s',
  opacity: 0,
  md: {
    fontSize: 'xl',
  },
});

export const heroCTA = css({
  display: 'flex',
  gap: '16px',
  flexWrap: 'wrap',
  justifyContent: 'center',
  animation: 'fadeIn 0.8s ease forwards',
  animationDelay: '0.4s',
  opacity: 0,
  mt: '8px',
});

// 機能紹介セクション
export const features = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  px: '24px',
  py: '64px',
  md: {
    py: '80px',
  },
});

export const featuresTitle = css({
  fontSize: '2xl',
  fontWeight: 'bold',
  color: 'text.primary',
  mb: '40px',
  textAlign: 'center',
  md: {
    fontSize: '3xl',
    mb: '56px',
  },
});

export const featuresList = css({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '24px',
  maxW: '1000px',
  w: '100%',
  md: {
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '32px',
  },
});

// 共通のカードスタイル
const featureCardBase = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: '16px',
  p: '32px',
  bg: 'bg.card',
  borderRadius: '24px',
  shadow: 'card.default',
  transition: 'all 0.3s',
  _hover: {
    shadow: 'card.hover',
    transform: 'translateY(-4px)',
  },
} as const;

export const featureCard = css(featureCardBase);

export const featureCard_1 = css({
  ...featureCardBase,
  animation: 'fadeIn 0.5s ease forwards',
  animationDelay: '0.1s',
  opacity: 0,
});

export const featureCard_2 = css({
  ...featureCardBase,
  animation: 'fadeIn 0.5s ease forwards',
  animationDelay: '0.2s',
  opacity: 0,
});

export const featureCard_3 = css({
  ...featureCardBase,
  animation: 'fadeIn 0.5s ease forwards',
  animationDelay: '0.3s',
  opacity: 0,
});

export const featureIcon = css({
  w: '48px',
  h: '48px',
  color: 'primary.default',
});

export const featureCardTitle = css({
  fontSize: 'xl',
  fontWeight: 'bold',
  color: 'text.primary',
  mt: '8px',
});

export const featureCardDescription = css({
  fontSize: 'md',
  color: 'text.secondary',
  lineHeight: 'relaxed',
});

// フッター
export const footer = css({
  mt: 'auto',
  py: '32px',
  px: '24px',
  borderTop: '1px solid',
  borderColor: 'border.subtle',
  textAlign: 'center',
});

export const footerText = css({
  fontSize: 'sm',
  color: 'text.muted',
});
