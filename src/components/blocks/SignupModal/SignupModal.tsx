// TODO: TDD Green フェーズで実装する
export type SignupModalProps = {
  isOpen: boolean;
  defaultUserName?: string;
  defaultNickname?: string;
  avatarUrl?: string;
  isCheckingUserName?: boolean;
  userNameAvailable?: boolean;
  initialStep?: number;
  defaultBio?: string;
  defaultFavoriteSystems?: string[];
  defaultFavoriteScenarios?: string;
  isSubmitting?: boolean;
  onComplete?: () => void;
};

export const SignupModal = (_props: SignupModalProps) => {
  return null;
};
