import type { UserRow } from '@/db/helpers';

// ユーザー型
type User = UserRow;

// ページProps
type UserProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export type { User, UserProfilePageProps };
