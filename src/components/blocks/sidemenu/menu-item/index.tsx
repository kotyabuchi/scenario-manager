import * as styles from './styles';

import type { LucideIcon } from 'lucide-react';

interface MenuItemProps {
  icon?: LucideIcon;
  text: string;
  active?: boolean;
  onClick: () => void;
}

export function MenuItem({
  icon,
  text,
  active = false,
  onClick,
}: MenuItemProps) {
  const IconComponent = icon;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <button
      type="button"
      className={styles.menuItem({ active })}
      onClick={handleClick}
    >
      {IconComponent && (
        <IconComponent size={32} className={styles.menuItemIcon} />
      )}
      <p className={styles.menuItemText}>{text}</p>
    </button>
  );
}
