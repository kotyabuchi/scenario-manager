'use client';

import { BookOpen, House, Users } from 'lucide-react';

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
  const [open, toggleOpen] = useToggleState(false);

  const handleToggle = () => {
    toggleOpen();
  };

  return (
    <VStack className={styles.sideMenu({ open })} onClick={handleToggle}>
      {menuItems.map((item) => (
        <MenuItem
          key={item.href}
          href={item.href}
          icon={item.icon}
          text={item.text}
        />
      ))}
    </VStack>
  );
}
