'use client';

import { BookOpen, House, Users } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

import { MenuItem } from './menu-item';
import * as styles from './styles';

import { useToggleState } from '@/hooks/use-toggle-state';
import { VStack } from '@/styled-system/jsx';

const menuItems = [
  {
    href: '/home',
    icon: House,
    text: 'Home',
  },
  {
    href: '/scenarios',
    icon: BookOpen,
    text: 'シナリオ',
  },
  {
    href: '/users',
    icon: Users,
    text: 'ユーザー',
  },
];

export function SideMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, toggleOpen] = useToggleState(false);

  const handleToggle = () => {
    toggleOpen();
  };

  const handleClickMenuItem = (href: string) => {
    router.push(href);
  };

  return (
    <aside className={styles.sideMenu({ open })} onClick={handleToggle}>
      <VStack className={styles.mainPages}>
        {menuItems.map((item) => (
          <MenuItem
            key={item.href}
            icon={item.icon}
            text={item.text}
            active={pathname === item.href}
            onClick={() => handleClickMenuItem(item.href)}
          />
        ))}
      </VStack>
      <VStack></VStack>
    </aside>
  );
}
