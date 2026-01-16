import type { InferSelectModel } from 'drizzle-orm';
import type { users } from '@/db/schema';

// Drizzleスキーマから型を導出
type User = InferSelectModel<typeof users>;

// プロフィール更新用の入力型（サーバー送信用）
export type { ProfileSubmitValues as UpdateProfileInput } from './_components/schema';

// コンポーネントProps
type ProfileCardProps = {
  user: User;
};

type ProfileEditFormProps = {
  user: User;
};

export type { User, ProfileCardProps, ProfileEditFormProps };
