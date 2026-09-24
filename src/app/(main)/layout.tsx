import { SignupModalWrapper } from './_components/SignupModalWrapper';

import { AuthPromptProvider } from '@/components/blocks/AuthPrompt';
import { BottomNav } from '@/components/blocks/BottomNav';
import { GlobalHeader } from '@/components/blocks/GlobalHeader';
import { SideMenu } from '@/components/blocks/SideMenu';
import { SpeedDialFAB } from '@/components/blocks/SpeedDialFAB';
import { AuthProvider } from '@/context';
import { BottomNavSlotProvider } from '@/hooks/useBottomNavSlot';
import { getDiscordAccountIdFromAuthUser } from '@/lib/supabase/discordAuth';
import { createClient } from '@/lib/supabase/server';
import { Flex, styled } from '@/styled-system/jsx';

import type { PropsWithChildren } from 'react';
import type { AuthUser, DiscordMeta } from '@/context';

export default async function MainLayout({ children }: PropsWithChildren) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let initialUser: AuthUser | null = null;
  let initialDiscordMeta: DiscordMeta | null = null;

  if (authUser) {
    const { data: dbUser } = await supabase
      .from('users')
      .select('user_id, discord_account_id, nickname, image, role')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    if (dbUser) {
      initialUser = {
        userId: dbUser.user_id,
        discordId: dbUser.discord_account_id,
        nickname: dbUser.nickname,
        avatar: dbUser.image,
        role: dbUser.role,
      };
    } else {
      initialDiscordMeta = {
        discordId: getDiscordAccountIdFromAuthUser(authUser) ?? authUser.id,
        avatarUrl: authUser.user_metadata?.avatar_url ?? null,
        userName: authUser.user_metadata?.full_name ?? null,
        displayName:
          authUser.user_metadata?.custom_claims?.global_name ??
          authUser.user_metadata?.full_name ??
          null,
      };
    }
  }

  return (
    <Flex minHeight="[100dvh]" bg="bg.page">
      <AuthProvider
        initialUser={initialUser}
        initialDiscordMeta={initialDiscordMeta}
      >
        <AuthPromptProvider>
          <BottomNavSlotProvider>
            <SideMenu />
            <Flex direction="column" flex="1" minWidth="0">
              <GlobalHeader />
              <styled.main
                flex="1"
                minWidth="0"
                display="flex"
                flexDirection="column"
                pb={{ base: '20', md: '0' }}
              >
                {children}
              </styled.main>
            </Flex>
            <BottomNav isAuthenticated={!!initialUser} />
            <SpeedDialFAB isAuthenticated={!!initialUser} />
            <SignupModalWrapper />
          </BottomNavSlotProvider>
        </AuthPromptProvider>
      </AuthProvider>
    </Flex>
  );
}
