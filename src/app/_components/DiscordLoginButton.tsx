'use client';

import { LogIn } from 'lucide-react';

import { useDiscordAuth } from '@/hooks/useDiscordAuth';

type DiscordLoginButtonProps = {
  className: string;
  iconClassName: string;
  textClassName: string;
};

export const DiscordLoginButton = ({
  className,
  iconClassName,
  textClassName,
}: DiscordLoginButtonProps) => {
  const { login } = useDiscordAuth();

  return (
    <button type="button" onClick={login} className={className}>
      <LogIn size={20} className={iconClassName} />
      <span className={textClassName}>Discordではじめる</span>
    </button>
  );
};
