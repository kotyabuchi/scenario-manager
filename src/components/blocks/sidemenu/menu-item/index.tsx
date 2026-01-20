import Image from 'next/image';

import * as styles from './styles';

import type { LucideIcon } from 'lucide-react';

type MenuItemVariant = 'default' | 'login' | 'signup' | 'logout' | 'profile';

interface MenuItemProps {
  icon?: LucideIcon;
  avatarSrc?: string;
  avatarAlt?: string;
  text: string;
  active?: boolean;
  variant?: MenuItemVariant;
  onClick: () => void;
}

export const MenuItem = ({
  icon,
  avatarSrc,
  avatarAlt,
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
      aria-label={text}
    >
      {avatarSrc ? (
        <Image
          src={avatarSrc}
          alt={avatarAlt ?? `${text}のアバター`}
          width={32}
          height={32}
          className={styles.menuItemAvatar}
        />
      ) : (
        IconComponent && (
          <IconComponent size={24} className={styles.menuItemIcon} />
        )
      )}
      <p className={styles.menuItemText}>{text}</p>
    </button>
  );
};
