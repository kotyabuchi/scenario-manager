import { useState } from 'react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { Users } from '@phosphor-icons/react/ssr';

import * as styles from '../styles';
import { MemberListItem, type ParticipantType } from './MemberListItem';
import { MemberSearchInput } from './MemberSearchInput';

import { Select, type SelectItem } from '@/components/elements/select';

import type { UserSummary } from '../../actions';
import type { SessionFormInput } from '../../schema';

type MemberUserMap = Map<string, UserSummary>;

type ParticipantsSectionProps = {
  /** 初期表示用のユーザー情報（編集フォーム時に使用） */
  initialMemberUsers?: MemberUserMap;
};

const creatorRoleItems: SelectItem[] = [
  { label: 'GM / KP', value: 'KEEPER' },
  { label: 'メンバー', value: 'PLAYER' },
  { label: '見学', value: 'SPECTATOR' },
];

export const ParticipantsSection = ({
  initialMemberUsers,
}: ParticipantsSectionProps = {}) => {
  const { control } = useFormContext<SessionFormInput>();
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'invitedMembers',
  });
  const [memberUsers, setMemberUsers] = useState<MemberUserMap>(
    initialMemberUsers ?? new Map(),
  );

  const handleMemberSelect = (user: UserSummary) => {
    if (fields.some((f) => f.userId === user.user_id)) return;
    append({ userId: user.user_id, participantType: 'PLAYER' });
    setMemberUsers((prev) => new Map(prev).set(user.user_id, user));
  };

  const handleMemberRemove = (index: number) => {
    const field = fields[index];
    remove(index);
    if (field) {
      setMemberUsers((prev) => {
        const next = new Map(prev);
        next.delete(field.userId);
        return next;
      });
    }
  };

  const handleRoleChange = (index: number, role: ParticipantType) => {
    const field = fields[index];
    if (field) {
      update(index, { ...field, participantType: role });
    }
  };

  return (
    <section className={styles.form_section}>
      <h2 className={styles.form_sectionHeader}>
        <Users className={styles.form_sectionIcon} />
        参加者
      </h2>

      <div className={styles.form_optionRow}>
        <div className={styles.form_optionText}>
          <div className={styles.form_optionTitle}>
            <span>作成者の参加種別</span>
          </div>
          <p className={styles.form_optionDescription}>
            作成者は参加者として登録されます
          </p>
        </div>
        <Controller
          name="creatorParticipantType"
          control={control}
          render={({ field }) => (
            <Select
              items={creatorRoleItems}
              value={[field.value ?? 'KEEPER']}
              onValueChange={(details) =>
                field.onChange(details.value[0] as ParticipantType)
              }
              aria-label="作成者の参加種別"
              variant="minimal"
              className={styles.form_optionSelect}
            />
          )}
        />
      </div>

      <MemberSearchInput
        onSelect={handleMemberSelect}
        excludeUserIds={fields.map((f) => f.userId)}
      />

      {fields.length > 0 ? (
        <div className={styles.form_membersList}>
          {fields.map((field, index) => {
            const user = memberUsers.get(field.userId);
            if (!user) return null;
            return (
              <MemberListItem
                key={field.id}
                user={user}
                role={field.participantType as ParticipantType}
                onRoleChange={(role) => handleRoleChange(index, role)}
                onRemove={() => handleMemberRemove(index)}
              />
            );
          })}
        </div>
      ) : (
        <p className={styles.form_membersEmpty}>
          メンバーを招待するとここに表示されます
        </p>
      )}
    </section>
  );
};
