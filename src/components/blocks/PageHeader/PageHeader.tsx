import { ArrowLeft } from '@phosphor-icons/react/ssr';
import Link from 'next/link';

import * as styles from './styles';

import { IconButton } from '@/components/elements/icon-button/icon-button';

import type { Route } from 'next';
import type { ReactNode } from 'react';

type PageHeaderProps = {
  backHref: Route<string>;
  title: string;
  actions?: ReactNode;
};

export const PageHeader = ({ backHref, title, actions }: PageHeaderProps) => {
  return (
    <header className={styles.header}>
      <div className={styles.header_left}>
        <IconButton variant="ghost" size="sm" fontSize="xl" asChild>
          <Link href={backHref} aria-label="戻る">
            <ArrowLeft />
          </Link>
        </IconButton>
        <h1 className={styles.header_title}>{title}</h1>
      </div>
      {actions}
    </header>
  );
};
