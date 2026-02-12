'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link as LinkIcon } from '@phosphor-icons/react/ssr';
import Link from 'next/link';

import { parseScenarioUrlAction } from '../actions';
import { type UrlInputValues, urlInputSchema } from './schema';
import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import { FormField } from '@/components/elements/form-field';
import { Input } from '@/components/elements/input';

import type { ParsedScenario } from '@/lib/scenario-fetcher';

type UrlInputStepProps = {
  onParsed: (data: ParsedScenario) => void;
};

export const UrlInputStep = ({ onParsed }: UrlInputStepProps) => {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<UrlInputValues>({
    resolver: zodResolver(urlInputSchema),
    defaultValues: { url: '' },
  });

  const onSubmit = (data: UrlInputValues) => {
    startTransition(async () => {
      const result = await parseScenarioUrlAction(data.url);

      if (!result.success) {
        setError('url', { message: result.error.message });
        return;
      }

      onParsed(result.data);
    });
  };

  return (
    <div className={styles.urlStep_container}>
      <div>
        <h2 className={styles.urlStep_title}>
          URLからシナリオ情報をインポート
        </h2>
        <p className={styles.urlStep_supportedSites}>
          対応サイト: Booth, TALTO
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <FormField id="url" label="シナリオURL" required error={errors.url}>
          <Input
            id="url"
            type="url"
            {...register('url')}
            placeholder="https://booth.pm/ja/items/... または https://talto.cc/projects/..."
          />
        </FormField>

        <div className={styles.urlStep_actions}>
          <Button variant="ghost" asChild>
            <Link href="/scenarios/new">手動で入力する場合はこちら</Link>
          </Button>

          <Button
            type="submit"
            status="primary"
            disabled={isPending}
            loading={isPending}
            loadingText="解析中..."
          >
            <LinkIcon size={18} />
            取り込む
          </Button>
        </div>
      </form>
    </div>
  );
};
