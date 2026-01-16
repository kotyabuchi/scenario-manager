import * as styles from './styles';

import type { LucideIcon } from 'lucide-react';

type MenuItemVariant = 'default' | 'login' | 'signup' | 'logout';

interface MenuItemProps {
  icon?: LucideIcon;
  text: string;
  active?: boolean;
  variant?: MenuItemVariant;
  onClick: () => void;
}

export const MenuItem = ({
  icon,
  text,
  active = false,
  variant = 'default',
  onClick,
}: MenuItemProps) => {
  const IconComponent = icon;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <button
      type="button"
      className={styles.menuItem({ active, variant })}
      onClick={handleClick}
    >
      {IconComponent && (
        <IconComponent size={32} className={styles.menuItemIcon} />
      )}
      <p className={styles.menuItemText}>{text}</p>
    </button>
  );
};
