import type { UserRow } from '@/db/helpers';

// ユーザー型
type User = UserRow;

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
  userName: string;
  nickname: string;
  bio: string | undefined;
};

export type { User, ProfileCardProps, ProfileEditFormProps, ProfileFormData };
