'use client';

import { type RefObject, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Link as LinkIcon,
  SpinnerGap,
  WarningCircle,
} from '@phosphor-icons/react/ssr';
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
  initialUrl: string | undefined;
  isAutoParsing: boolean;
  autoParseError: string | null;
  errorRef: RefObject<HTMLDivElement | null>;
};

export const UrlInputStep = ({
  onParsed,
  initialUrl,
  isAutoParsing,
  autoParseError,
  errorRef,
}: UrlInputStepProps) => {
  const [isPending, startTransition] = useTransition();
  const isLoading = isPending || isAutoParsing;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<UrlInputValues>({
    resolver: zodResolver(urlInputSchema),
    defaultValues: { url: initialUrl ?? '' },
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
      {autoParseError && (
        <div
          ref={errorRef}
          role="alert"
          tabIndex={-1}
          data-testid="auto-parse-error"
          className={styles.urlStep_autoParseError}
        >
          <WarningCircle size={18} weight="fill" />
          <span>{autoParseError}</span>
        </div>
      )}

      {isAutoParsing && (
        <div className={styles.urlStep_loading}>
          <SpinnerGap size={24} className={styles.urlStep_spinner} />
          <span>URLを解析中...</span>
        </div>
      )}

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
            disabled={isLoading}
          />
        </FormField>

        <div className={styles.urlStep_actions}>
          {isLoading ? (
            <Button variant="ghost" disabled>
              手動で入力する場合はこちら
            </Button>
          ) : (
            <Button variant="ghost" asChild>
              <Link href="/scenarios/new">手動で入力する場合はこちら</Link>
            </Button>
          )}

          <Button
            type="submit"
            status="primary"
            disabled={isLoading}
            loading={isLoading}
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
