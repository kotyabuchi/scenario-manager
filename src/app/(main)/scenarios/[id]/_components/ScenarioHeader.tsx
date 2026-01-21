'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { css } from '@/styled-system/css';

type ScenarioHeaderProps = {
  scenarioName: string;
};

const header = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'md',
  mb: 'lg',
});

const header_backButton = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '40px',
  height: '40px',
  borderRadius: 'full',
  bg: 'transparent',
  color: 'text.secondary',
  fontSize: 'xl',
  cursor: 'pointer',
  transition: 'all {durations.normal}',
  flexShrink: 0,
  _hover: {
    bg: 'bg.subtle',
    color: 'text.primary',
  },
});

const header_title = css({
  flex: 1,
  fontSize: 'xl',
  fontWeight: 'bold',
  color: 'text.primary',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const ScenarioHeader = ({ scenarioName }: ScenarioHeaderProps) => {
  return (
    <header className={header}>
      <Link
        href="/scenarios"
        className={header_backButton}
        aria-label="シナリオ一覧に戻る"
      >
        <ArrowLeft size={20} />
      </Link>

      <h1 className={header_title}>{scenarioName}</h1>
    </header>
  );
};
