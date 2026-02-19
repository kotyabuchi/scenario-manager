'use client';

import { Trash } from '@phosphor-icons/react/ssr';

import * as styles from './memberStyles';

import { Avatar } from '@/components/elements/avatar';
import { IconButton } from '@/components/elements/icon-button/icon-button';
import {
  RadioGroup,
  type RadioGroupItem,
} from '@/components/elements/radio-group';

import type { UserSummary } from '../actions';

type ParticipantType = 'PLAYER' | 'SPECTATOR';

const roleItems: RadioGroupItem[] = [
  { label: 'PL', value: 'PLAYER' },
  { label: '見学', value: 'SPECTATOR' },
];

type MemberListItemProps = {
  /** ユーザー情報 */
  user: UserSummary;
  /** 参加者タイプ */
  role: ParticipantType;
  /** 役割変更時のコールバック */
  onRoleChange: (role: ParticipantType) => void;
  /** 削除時のコールバック */
  onRemove: () => void;
};

export const MemberListItem = ({
  user,
  role,
  onRoleChange,
  onRemove,
}: MemberListItemProps) => {
  return (
    <div className={styles.memberItem}>
      <div className={styles.memberItem_info}>
        <Avatar
          {...(user.image ? { src: user.image } : {})}
          alt={user.nickname}
          size="sm"
        />
        <div className={styles.memberItem_text}>
          <span className={styles.memberItem_nickname}>{user.nickname}</span>
          <span className={styles.memberItem_username}>@{user.user_name}</span>
        </div>
      </div>

      <div className={styles.memberItem_actions}>
        <RadioGroup
          items={roleItems}
          value={role}
          onValueChange={(d) => onRoleChange(d.value as ParticipantType)}
          orientation="horizontal"
        />
        <IconButton
          aria-label={`${user.nickname}を削除`}
          onClick={onRemove}
          variant="ghost"
          size="sm"
        >
          <Trash size={16} />
        </IconButton>
      </div>
    </div>
  );
};

export type { ParticipantType, MemberListItemProps };
