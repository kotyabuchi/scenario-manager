import type { InferSelectModel } from 'drizzle-orm';
import type { users } from '@/db/schema';

// Drizzleスキーマから型を導出
type User = InferSelectModel<typeof users>;

// ProfileCard Props
type ProfileCardProps = {
  user: User;
  /** 編集ボタンを表示するか（自分のプロフィールの場合） */
  showEditButton?: boolean;
};

// ProfileEditForm Props
type ProfileEditFormProps = {
  user: User;
  /** プロフィール更新時のコールバック */
  onUpdate: (
    data: ProfileFormData,
  ) => Promise<{ success: boolean; error?: string }>;
};

// フォームデータの型
type ProfileFormData = {
  nickname: string;
  bio: string | undefined;
};

export type { User, ProfileCardProps, ProfileEditFormProps, ProfileFormData };
