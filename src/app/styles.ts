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
  px: 'lg',
  py: '4xl',
  bg: 'linear-gradient(180deg, {colors.bg.subtle}, {colors.bg.base})',
  textAlign: 'center',
  gap: 'xl',
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
  gap: 'md',
  flexWrap: 'wrap',
  justifyContent: 'center',
  animation: 'fadeIn 0.8s ease forwards',
  animationDelay: '0.4s',
  opacity: 0,
});

// 機能紹介セクション
export const features = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  px: 'lg',
  py: '4xl',
  bg: 'bg.base',
});

export const featuresTitle = css({
  fontSize: '2xl',
  fontWeight: 'bold',
  color: 'text.primary',
  mb: '2xl',
  textAlign: 'center',
  md: {
    fontSize: '3xl',
  },
});

export const featuresList = css({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: 'xl',
  maxW: '1200px',
  w: '100%',
  md: {
    gridTemplateColumns: 'repeat(3, 1fr)',
  },
});

export const featureCard = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'md',
  p: 'xl',
  bg: 'bg.card',
  borderRadius: 'xl',
  shadow: 'card.default',
  transition: 'all 0.3s',
  _hover: {
    shadow: 'card.hover',
    transform: 'translateY(-4px)',
  },
});

export const featureCard_1 = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'md',
  p: 'xl',
  bg: 'bg.card',
  borderRadius: 'xl',
  shadow: 'card.default',
  transition: 'all 0.3s',
  animation: 'fadeIn 0.5s ease forwards',
  animationDelay: '0.1s',
  opacity: 0,
  _hover: {
    shadow: 'card.hover',
    transform: 'translateY(-4px)',
  },
});

export const featureCard_2 = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'md',
  p: 'xl',
  bg: 'bg.card',
  borderRadius: 'xl',
  shadow: 'card.default',
  transition: 'all 0.3s',
  animation: 'fadeIn 0.5s ease forwards',
  animationDelay: '0.2s',
  opacity: 0,
  _hover: {
    shadow: 'card.hover',
    transform: 'translateY(-4px)',
  },
});

export const featureCard_3 = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'md',
  p: 'xl',
  bg: 'bg.card',
  borderRadius: 'xl',
  shadow: 'card.default',
  transition: 'all 0.3s',
  animation: 'fadeIn 0.5s ease forwards',
  animationDelay: '0.3s',
  opacity: 0,
  _hover: {
    shadow: 'card.hover',
    transform: 'translateY(-4px)',
  },
});

export const featureIcon = css({
  w: '48px',
  h: '48px',
  color: 'primary.default',
  mb: 'sm',
});

export const featureCardTitle = css({
  fontSize: 'xl',
  fontWeight: 'bold',
  color: 'text.primary',
});

export const featureCardDescription = css({
  fontSize: 'md',
  color: 'text.secondary',
  lineHeight: 'relaxed',
});

// フッター
export const footer = css({
  mt: 'auto',
  py: 'xl',
  px: 'lg',
  bg: 'bg.subtle',
  borderTop: '1px solid',
  borderColor: 'border.subtle',
  textAlign: 'center',
});

export const footerText = css({
  fontSize: 'sm',
  color: 'text.muted',
});
