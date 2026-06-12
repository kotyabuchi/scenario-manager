'use client';

import { SignOut, User } from '@phosphor-icons/react/ssr';
import Image from 'next/image';
import NextLink from 'next/link';

import * as styles from './styles';

import { Menu } from '@/components/elements/menu';

type SidebarUserMenuProps = {
  nickname: string;
  avatarUrl: string | null;
};

export const SidebarUserMenu = ({
  nickname,
  avatarUrl,
}: SidebarUserMenuProps) => {
  return (
    <Menu.Root positioning={{ placement: 'top-start' }}>
      <Menu.Trigger
        className={styles.sidebarUserMenu_trigger}
        aria-label="ユーザーメニュー"
        title={nickname}
      >
        <span className={styles.sidebarUserMenu_avatar}>
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt=""
              width={36}
              height={36}
              className={styles.sidebarUserMenu_avatarImage}
            />
          ) : null}
        </span>
        <span className={styles.sidebarUserMenu_nickname}>{nickname}</span>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.Item value="profile" asChild>
            <NextLink href="/profile">
              <User size={16} />
              <Menu.ItemText>マイページ</Menu.ItemText>
            </NextLink>
          </Menu.Item>
          <Menu.Separator />
          <Menu.Item value="logout" asChild>
            <NextLink href="/logout">
              <SignOut size={16} />
              <Menu.ItemText>ログアウト</Menu.ItemText>
            </NextLink>
          </Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
};

export type { SidebarUserMenuProps };
