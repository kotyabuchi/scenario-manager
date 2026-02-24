import { type FieldErrors, useFormContext, useWatch } from 'react-hook-form';
import { NoteIcon } from '@phosphor-icons/react/ssr';

import * as styles from '../../styles';

import { FormField } from '@/components/elements/form-field';
import { Input } from '@/components/elements/input';
import { Textarea } from '@/components/elements/textarea';

import type { SessionFormInput } from '../../../schema';

type BasicInfoSectionProps = {
  errors?: FieldErrors<SessionFormInput>;
};

export const BasicInfoSection = ({ errors }: BasicInfoSectionProps) => {
  const { register, control } = useFormContext<SessionFormInput>();
  const descriptionValue = useWatch({ name: 'sessionDescription', control });

  return (
    <section className={styles.form_section}>
      <h2 className={styles.form_sectionHeader}>
        <NoteIcon className={styles.form_sectionIcon} />
        基本情報
      </h2>

      <FormField
        id="sessionName"
        label="セッション名"
        required
        error={errors?.sessionName}
      >
        <Input
          id="sessionName"
          {...register('sessionName')}
          placeholder="例: 週末CoC7版セッション"
          maxLength={100}
        />
      </FormField>

      <div>
        <FormField
          id="sessionDescription"
          label="募集文"
          required
          error={errors?.sessionDescription}
        >
          <Textarea
            id="sessionDescription"
            {...register('sessionDescription')}
            placeholder="セッションの概要や参加者への呼びかけを書いてください"
            maxLength={500}
          />
        </FormField>
        <p className={styles.form_charCount} aria-live="polite">
          {descriptionValue?.length ?? 0}/500
        </p>
      </div>
    </section>
  );
};
