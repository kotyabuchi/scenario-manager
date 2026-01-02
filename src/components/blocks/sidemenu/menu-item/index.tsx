import Link from 'next/link';

import * as styles from './styles';

import type { LucideIcon } from 'lucide-react';

interface MenuItemProps {
  href: string;
  icon: LucideIcon;
  text: string;
}

export function MenuItem({ href, icon, text }: MenuItemProps) {
  const Icon = icon;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
  };

  return (
    <Link href={href} className={styles.menuItem} onClick={handleClick}>
      <Icon size={32} className={styles.menuItemIcon} />
      <p className={styles.menuItemText}>{text}</p>
    </Link>
  );
}
