'use client';

import { updateProfile } from '../actions';

import { ProfileEditForm, type User } from '@/components/blocks/Profile';

type ProfileEditFormWrapperProps = {
  user: User;
};

export const ProfileEditFormWrapper = ({
  user,
}: ProfileEditFormWrapperProps) => {
  const handleUpdate = async (data: {
    userName: string;
    nickname: string;
    bio: string | undefined;
  }): Promise<{ success: boolean; error?: string }> => {
    const result = await updateProfile(data);
    if (result.success) {
      return { success: true };
    }
    return { success: false, error: result.error.message };
  };

  return <ProfileEditForm user={user} onUpdate={handleUpdate} />;
};
