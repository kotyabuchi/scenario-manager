import Link from 'next/link';

import * as styles from './styles';

import type { Icon } from '@phosphor-icons/react/dist/lib/types';
import type { Route } from 'next';

type SidebarNavItemProps = {
  href: Route<string>;
  label: string;
  icon: Icon;
  active: boolean;
};

export const SidebarNavItem = ({
  href,
  label,
  icon: IconComponent,
  active,
}: SidebarNavItemProps) => {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      aria-label={label}
      title={label}
      className={styles.sidebarNavItem_link({ active })}
    >
      <IconComponent
        size={20}
        weight={active ? 'fill' : 'regular'}
        className={styles.sidebarNavItem_icon}
      />
      <span className={styles.sidebarNavItem_label}>{label}</span>
    </Link>
  );
};

export type { SidebarNavItemProps };
