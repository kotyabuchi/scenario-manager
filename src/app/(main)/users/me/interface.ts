import type { InferSelectModel } from 'drizzle-orm';
import type { users } from '@/db/schema';

// Drizzleスキーマから型を導出
type User = InferSelectModel<typeof users>;

// プロフィール更新用の入力型
type UpdateProfileInput = {
  nickname: string;
  bio?: string | undefined;
};

// コンポーネントProps
type ProfileCardProps = {
  user: User;
};

type ProfileEditFormProps = {
  user: User;
};

export type {
  User,
  UpdateProfileInput,
  ProfileCardProps,
  ProfileEditFormProps,
};
