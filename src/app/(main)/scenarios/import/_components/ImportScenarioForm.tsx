'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowSquareOut, Check, Info, Lock } from '@phosphor-icons/react/ssr';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { isNil } from 'ramda';

import { createImportedScenarioAction } from '../actions';
import {
  type ImportFormInput,
  type ImportFormValues,
  importFormSchema,
} from './schema';
import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import { Chip } from '@/components/elements/Chip';
import { FieldError } from '@/components/elements/field-error/field-error';
import { FileUpload } from '@/components/elements/file-upload';
import { FormField } from '@/components/elements/form-field';
import { Input } from '@/components/elements/input';
import { Radio } from '@/components/elements/radio';
import {
  Select,
  type SelectValueChangeDetails,
} from '@/components/elements/select';
import { Slider } from '@/components/elements/slider';
import { Textarea } from '@/components/elements/textarea';
import { HandoutTypes } from '@/db/enum';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useRangeInputs } from '@/hooks/useRangeInputs';
import { useSystemMessageActions } from '@/hooks/useSystemMessage';

import type { ParsedScenario } from '@/lib/scenario-fetcher';
import type { ScenarioSystem, Tag } from '../../interface';

type ImportScenarioFormProps = {
  parsedData: ParsedScenario;
  systems: ScenarioSystem[];
  tags: Tag[];
  onBack: () => void;
};

/**
 * ParsedField の値を取得するヘルパー
 */
const fieldValue = <T,>(
  field: { value: T; confidence: string } | null,
): T | undefined => {
  return field?.value ?? undefined;
};

/**
 * フィールドが readOnly かどうかを判定する
 */
const isFieldReadonly = (
  field: { value: unknown; confidence: string } | null,
): boolean => {
  return field?.confidence === 'high';
};

export const ImportScenarioForm = ({
  parsedData,
  systems,
  tags,
  onBack,
}: ImportScenarioFormProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { addMessage } = useSystemMessageActions();
  // プレイ人数・時間の初期値（秒→時間に変換）
  const initialMinPlayer = fieldValue(parsedData.minPlayer) ?? 1;
  const initialMaxPlayer = fieldValue(parsedData.maxPlayer) ?? 4;
  const initialMinPlaytime = fieldValue(parsedData.minPlaytime)
    ? Math.max(
        1,
        Math.min(
          48,
          Math.round((fieldValue(parsedData.minPlaytime) ?? 3600) / 3600),
        ),
      )
    : 1;
  const initialMaxPlaytime = fieldValue(parsedData.maxPlaytime)
    ? Math.max(
        1,
        Math.min(
          48,
          Math.round((fieldValue(parsedData.maxPlaytime) ?? 10800) / 3600),
        ),
      )
    : 3;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ImportFormInput, unknown, ImportFormValues>({
    resolver: zodResolver(importFormSchema),
    defaultValues: {
      name: fieldValue(parsedData.title) ?? '',
      author: fieldValue(parsedData.author) ?? '',
      minPlayer: fieldValue(parsedData.minPlayer),
      maxPlayer: fieldValue(parsedData.maxPlayer),
      // 時間単位の初期値×60で分に変換してセット
      minPlaytime: initialMinPlaytime * 60,
      maxPlaytime: initialMaxPlaytime * 60,
      scenarioSystemId: '',
      handoutType: HandoutTypes.NONE.value,
      description: '',
      scenarioImage: null,
      scenarioImageUrl: '',
      tagIds: [],
      distributeUrl: parsedData.sourceUrl,
      sourceType: parsedData.sourceType,
      sourceUrl: parsedData.sourceUrl,
    },
  });

  // 画像アップロード
  const { previewUrl, handleImageSelect, handleImageRemove, cleanupPreview } =
    useImageUpload({
      setImageValue: (file) =>
        setValue('scenarioImage', file, { shouldValidate: true }),
      clearImageUrl: () => setValue('scenarioImageUrl', ''),
    });

  // プレイ人数レンジ
  const playerInputs = useRangeInputs({
    initialMin: initialMinPlayer,
    initialMax: initialMaxPlayer,
    setMinValue: (v) => setValue('minPlayer', v),
    setMaxValue: (v) => setValue('maxPlayer', v),
  });

  // プレイ時間レンジ（時間単位、DB保存時に分に変換）
  const playtimeInputs = useRangeInputs({
    initialMin: initialMinPlaytime,
    initialMax: initialMaxPlaytime,
    setMinValue: (v) => setValue('minPlaytime', v * 60),
    setMaxValue: (v) => setValue('maxPlaytime', v * 60),
  });

  const selectedSystemId = watch('scenarioSystemId');
  const selectedTagIds = watch('tagIds') as string[];
  const selectedHandoutType = watch('handoutType');

  // システム選択変更
  const handleSystemChange = (
    details: SelectValueChangeDetails<{ label: string; value: string }>,
  ) => {
    const value = details.value[0];
    if (!isNil(value)) setValue('scenarioSystemId', value);
  };

  // ハンドアウト選択変更
  const handleHandoutChange = (details: { value: string | null }) => {
    if (!isNil(details.value)) {
      setValue('handoutType', details.value as 'NONE' | 'PUBLIC' | 'SECRET');
    }
  };

  // タグ選択/解除
  const toggleTag = (tagId: string) => {
    const current = selectedTagIds;
    if (current.includes(tagId)) {
      setValue(
        'tagIds',
        current.filter((id) => id !== tagId),
      );
    } else {
      setValue('tagIds', [...current, tagId]);
    }
  };

  const onSubmit = (data: ImportFormValues) => {
    startTransition(async () => {
      let imageUrl = data.scenarioImageUrl;

      if (!isNil(data.scenarioImage)) {
        try {
          const formData = new FormData();
          formData.append('file', data.scenarioImage);
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          const uploadResult = (await response.json()) as {
            url?: string;
            error?: string;
          };
          if (!response.ok) {
            addMessage(
              'danger',
              uploadResult.error ?? '画像のアップロードに失敗しました',
            );
            return;
          }
          imageUrl = uploadResult.url ?? '';
        } catch {
          addMessage('danger', '画像のアップロードに失敗しました');
          return;
        }
      }

      const result = await createImportedScenarioAction({
        ...data,
        scenarioImageUrl: imageUrl,
      });

      if (!result.success) {
        addMessage('danger', result.error?.message ?? '登録に失敗しました');
      } else {
        cleanupPreview();
        addMessage('success', 'シナリオを登録しました');
        router.push(`/scenarios/${result.data.scenarioId}`);
      }
    });
  };

  const systemItems = systems.map((s) => ({
    label: s.name,
    value: s.systemId,
  }));
  const selectedTags = tags.filter((t) => selectedTagIds.includes(t.tagId));
  const unselectedTags = tags.filter((t) => !selectedTagIds.includes(t.tagId));

  const authorReadonly = isFieldReadonly(parsedData.author);
  const playerReadonly =
    isFieldReadonly(parsedData.minPlayer) ||
    isFieldReadonly(parsedData.maxPlayer);
  const playtimeReadonly =
    isFieldReadonly(parsedData.minPlaytime) ||
    isFieldReadonly(parsedData.maxPlaytime);

  const sourceLabel = parsedData.sourceType === 'booth' ? 'Booth' : 'TALTO';

  return (
    <div className={styles.form_card}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.form_body}>
          {/* ソース情報バナー */}
          <div className={styles.form_sourceBanner}>
            <span className={styles.form_sourceLabel}>
              インポート元: {sourceLabel}
            </span>
            <a
              href={parsedData.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.form_sourceLink}
            >
              配布ページを見る
              <ArrowSquareOut size={14} />
            </a>
          </div>

          {/* インポート済み情報 */}
          <div className={styles.form_infoSection}>
            <p className={styles.form_sectionTitle}>インポート済み情報</p>
            <hr className={styles.form_divider} />
            <div className={styles.form_fieldRow}>
              <FormField
                id="name"
                label="シナリオ名"
                required
                error={errors.name}
              >
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="シナリオ名を入力"
                  maxLength={100}
                />
              </FormField>

              <FormField id="author" label="作者名" error={errors.author}>
                <div className={styles.form_readonlyField}>
                  <Input
                    id="author"
                    {...register('author')}
                    placeholder="作者名を入力（任意）"
                    maxLength={100}
                    readOnly={authorReadonly}
                    className={
                      authorReadonly ? styles.form_readonlyInput : undefined
                    }
                  />
                  {authorReadonly && (
                    <span className={styles.form_readonlyIcon}>
                      <Lock size={14} />
                    </span>
                  )}
                </div>
              </FormField>
            </div>

            {/* readOnly プレイ人数・時間（各フィールド独立で判定） */}
            {(playerReadonly || playtimeReadonly) && (
              <div className={styles.form_fieldRow}>
                {playerReadonly && (
                  <FormField id="readonly-player-count" label="プレイ人数">
                    <div className={styles.form_readonlyField}>
                      <Input
                        id="readonly-player-count"
                        value={
                          parsedData.minPlayer && parsedData.maxPlayer
                            ? `${parsedData.minPlayer.value}〜${parsedData.maxPlayer.value}人`
                            : '未設定'
                        }
                        readOnly
                        className={styles.form_readonlyInput}
                      />
                      <span className={styles.form_readonlyIcon}>
                        <Lock size={14} />
                      </span>
                    </div>
                  </FormField>
                )}

                {playtimeReadonly && (
                  <FormField id="readonly-playtime" label="プレイ時間">
                    <div className={styles.form_readonlyField}>
                      <Input
                        id="readonly-playtime"
                        value={
                          parsedData.minPlaytime || parsedData.maxPlaytime
                            ? `${
                                parsedData.minPlaytime
                                  ? `${Math.round(parsedData.minPlaytime.value / 3600)}時間`
                                  : ''
                              }${parsedData.minPlaytime && parsedData.maxPlaytime ? '〜' : ''}${
                                parsedData.maxPlaytime
                                  ? `${Math.round(parsedData.maxPlaytime.value / 3600)}時間`
                                  : ''
                              }`
                            : '未設定'
                        }
                        readOnly
                        className={styles.form_readonlyInput}
                      />
                      <span className={styles.form_readonlyIcon}>
                        <Lock size={14} />
                      </span>
                    </div>
                  </FormField>
                )}
              </div>
            )}
          </div>

          {/* 手動入力セクション */}
          <div className={styles.form_manualSection}>
            <p className={styles.form_sectionTitle}>手動入力</p>
            <hr className={styles.form_divider} />

            {/* 画像 + 基本情報 */}
            <div className={styles.form_topRow}>
              <div className={styles.form_imageSection}>
                <FormField
                  label="サムネイル画像"
                  error={isNil(previewUrl) ? errors.scenarioImage : undefined}
                >
                  {!isNil(previewUrl) ? (
                    <div className={styles.form_imagePreview}>
                      <Image
                        src={previewUrl}
                        alt="選択した画像"
                        fill
                        className={styles.form_previewImage}
                        unoptimized
                      />
                      <button
                        type="button"
                        className={styles.form_imageRemove}
                        onClick={handleImageRemove}
                      >
                        削除
                      </button>
                    </div>
                  ) : (
                    <div className={styles.form_imageUploadWrapper}>
                      <FileUpload
                        accept={[
                          'image/jpeg',
                          'image/png',
                          'image/webp',
                          'image/gif',
                        ]}
                        maxFileSize={5 * 1024 * 1024}
                        maxFiles={1}
                        onFileAccept={handleImageSelect}
                        dropzoneText="クリックまたはドラッグで画像をアップロード"
                        hint="PNG, JPG, WebP, GIF（最大5MB）※600×600pxに自動リサイズ"
                        compact
                        square
                      />
                    </div>
                  )}
                </FormField>
              </div>

              {/* 右側フィールド群 */}
              <div className={styles.form_rightFields}>
                <FormField
                  label="ゲームシステム"
                  required
                  error={errors.scenarioSystemId}
                >
                  <Select
                    items={systemItems}
                    value={selectedSystemId ? [selectedSystemId] : []}
                    onValueChange={handleSystemChange}
                    placeholder="システムを選択"
                  />
                </FormField>

                <FormField label="ハンドアウト形式" error={errors.handoutType}>
                  <Radio
                    value={selectedHandoutType}
                    onValueChange={handleHandoutChange}
                    className={styles.form_radioRow}
                  >
                    {Object.values(HandoutTypes).map((type) => (
                      <Radio.Item key={type.value} value={type.value}>
                        {type.label}
                      </Radio.Item>
                    ))}
                  </Radio>
                </FormField>

                <FormField label="タグ">
                  <div className={styles.form_chips}>
                    {selectedTags.map((tag) => (
                      <Chip
                        key={tag.tagId}
                        label={tag.name}
                        selected
                        removable
                        onRemove={() => toggleTag(tag.tagId)}
                      />
                    ))}
                    {unselectedTags.map((tag) => (
                      <Chip
                        key={tag.tagId}
                        label={tag.name}
                        onClick={() => toggleTag(tag.tagId)}
                      />
                    ))}
                  </div>
                </FormField>
              </div>
            </div>

            {/* プレイ人数・時間（各フィールド独立で判定） */}
            {(!playerReadonly || !playtimeReadonly) && (
              <div className={styles.form_sliderGrid}>
                {!playerReadonly && (
                  <div className={styles.form_field}>
                    <span className={styles.form_label}>プレイ人数</span>
                    <div className={styles.form_sliderControls}>
                      <Slider
                        value={playerInputs.range}
                        onValueChange={playerInputs.handleSliderChange}
                        min={1}
                        max={10}
                        step={1}
                        range
                      />
                      <div className={styles.form_sliderMinMax}>
                        <span>1</span>
                        <span className={styles.form_sliderValue}>
                          {playerInputs.range[0]} 〜 {playerInputs.range[1]} 人
                        </span>
                        <span>10+</span>
                      </div>
                    </div>
                    <FieldError error={errors.minPlayer} />
                    <FieldError error={errors.maxPlayer} />
                  </div>
                )}

                {!playtimeReadonly && (
                  <div className={styles.form_field}>
                    <span className={styles.form_label}>プレイ時間</span>
                    <div className={styles.form_sliderControls}>
                      <Slider
                        value={playtimeInputs.range}
                        onValueChange={playtimeInputs.handleSliderChange}
                        min={1}
                        max={48}
                        step={1}
                        range
                      />
                      <div className={styles.form_sliderMinMax}>
                        <span>1</span>
                        <span className={styles.form_sliderValue}>
                          {playtimeInputs.range[0]} 〜 {playtimeInputs.range[1]}{' '}
                          時間
                        </span>
                        <span>48+</span>
                      </div>
                    </div>
                    <FieldError error={errors.minPlaytime} />
                    <FieldError error={errors.maxPlaytime} />
                  </div>
                )}
              </div>
            )}

            {/* シナリオ概要 */}
            <FormField
              id="description"
              label="シナリオ概要"
              error={errors.description}
            >
              <Textarea
                id="description"
                {...register('description')}
                placeholder="シナリオの概要を入力（任意）"
                maxLength={2000}
              />
            </FormField>

            {/* 著作権注意メッセージ */}
            <div className={styles.form_notice}>
              <Info size={16} className={styles.form_noticeIcon} />
              <span>
                タイトル・作者名・プレイ人数・時間は事実情報として自動取得しています。概要文や画像は著作権保護のため手動入力としています。掲載内容に問題がある場合はお知らせください。
              </span>
            </div>
          </div>
        </div>

        {/* hidden fields */}
        <input type="hidden" {...register('distributeUrl')} />
        <input type="hidden" {...register('sourceType')} />
        <input type="hidden" {...register('sourceUrl')} />

        {/* フッター */}
        <hr className={styles.form_divider} />
        <div className={styles.form_footer}>
          <Button type="button" variant="ghost" onClick={onBack}>
            戻る
          </Button>
          <Button
            type="submit"
            status="primary"
            disabled={isPending}
            loading={isPending}
            loadingText="登録中..."
          >
            <Check size={18} />
            登録する
          </Button>
        </div>
      </form>
    </div>
  );
};
