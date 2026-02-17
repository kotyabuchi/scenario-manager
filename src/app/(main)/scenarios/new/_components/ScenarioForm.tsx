'use client';

import { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Info, Link as LinkIcon } from '@phosphor-icons/react/ssr';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isNil } from 'ramda';

import { createScenarioAction } from '../actions';
import {
  type ScenarioFormInput,
  type ScenarioFormValues,
  scenarioFormSchema,
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
import { isImportableUrl } from '@/lib/scenario-fetcher/url-validator';

import type { ScenarioSystem, Tag } from '../../interface';

type ScenarioFormProps = {
  systems: ScenarioSystem[];
  tags: Tag[];
};

export const ScenarioForm = ({ systems, tags }: ScenarioFormProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { addMessage } = useSystemMessageActions();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ScenarioFormInput, unknown, ScenarioFormValues>({
    resolver: zodResolver(scenarioFormSchema),
    defaultValues: {
      name: '',
      scenarioSystemId: '',
      handoutType: HandoutTypes.NONE.value,
      author: '',
      description: '',
      minPlayer: undefined,
      maxPlayer: undefined,
      minPlaytime: 60,
      maxPlaytime: 180,
      scenarioImage: null,
      scenarioImageUrl: '',
      distributeUrl: '',
      tagIds: [],
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
    initialMin: 1,
    initialMax: 4,
    setMinValue: (v) => setValue('minPlayer', v),
    setMaxValue: (v) => setValue('maxPlayer', v),
  });

  // プレイ時間レンジ（時間単位、DB保存時に分に変換）
  const playtimeInputs = useRangeInputs({
    initialMin: 1,
    initialMax: 3,
    setMinValue: (v) => setValue('minPlaytime', v * 60),
    setMaxValue: (v) => setValue('maxPlaytime', v * 60),
  });

  const selectedSystemId = watch('scenarioSystemId');
  const selectedTagIds = watch('tagIds') as string[];
  const selectedHandoutType = watch('handoutType');
  const distributeUrl = watch('distributeUrl');

  // インポート対応URL検知（300msデバウンス）
  const [showImportBanner, setShowImportBanner] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowImportBanner(isImportableUrl(distributeUrl ?? ''));
    }, 300);
    return () => clearTimeout(timer);
  }, [distributeUrl]);

  // システム選択変更
  const handleSystemChange = (
    details: SelectValueChangeDetails<{ label: string; value: string }>,
  ) => {
    const value = details.value[0];
    if (!isNil(value)) {
      setValue('scenarioSystemId', value);
    }
  };

  // ハンドアウト選択変更（Radio用）
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

  const onSubmit = (data: ScenarioFormValues) => {
    startTransition(async () => {
      let imageUrl = data.scenarioImageUrl;

      // 選択された画像があればアップロード
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

      const result = await createScenarioAction({
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

  const handleCancel = () => {
    router.back();
  };

  // システム選択肢
  const systemItems = systems.map((system) => ({
    label: system.name,
    value: system.systemId,
  }));

  // 選択されたタグ
  const selectedTags = tags.filter((tag) => selectedTagIds.includes(tag.tagId));
  // 未選択のタグ
  const unselectedTags = tags.filter(
    (tag) => !selectedTagIds.includes(tag.tagId),
  );

  return (
    <div className={styles.form_card}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.form_body}>
          {/* セクション1: 画像 + 基本情報 */}
          <div className={styles.form_topRow}>
            {/* 画像アップロード */}
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

            {/* 右側フィールド群（縦積み） */}
            <div className={styles.form_rightFields}>
              <FormField
                id="name"
                label="シナリオ名"
                required
                error={errors.name}
              >
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="例：インセイン：灰の降る街"
                  maxLength={100}
                />
              </FormField>

              <FormField
                label="ゲームシステム"
                required
                error={errors.scenarioSystemId}
              >
                <Select
                  items={systemItems}
                  value={selectedSystemId ? [selectedSystemId] : []}
                  onValueChange={handleSystemChange}
                  placeholder="選択してください"
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

              <FormField id="author" label="作者名" error={errors.author}>
                <Input
                  id="author"
                  {...register('author')}
                  placeholder="作者名を入力"
                  maxLength={100}
                />
              </FormField>
            </div>
          </div>

          {/* セクション2: 概要 + タグ */}
          <div className={styles.form_section}>
            <FormField
              id="description"
              label="シナリオ概要"
              error={errors.description}
            >
              <Textarea
                id="description"
                {...register('description')}
                placeholder="シナリオのあらすじや導入を記入してください。"
                maxLength={2000}
              />
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

          {/* セクション3: プレイ人数 + プレイ時間（2カラムグリッド） */}
          <div className={styles.form_sliderGrid}>
            {/* プレイ人数 */}
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

            {/* プレイ時間 */}
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
                    {playtimeInputs.range[0]} 〜 {playtimeInputs.range[1]} 時間
                  </span>
                  <span>48+</span>
                </div>
              </div>
              <FieldError error={errors.minPlaytime} />
              <FieldError error={errors.maxPlaytime} />
            </div>
          </div>

          {/* 配布URL */}
          <FormField
            id="distributeUrl"
            label="配布URL"
            error={errors.distributeUrl}
          >
            <div className={styles.form_urlInputWrapper}>
              <span className={styles.form_urlIcon}>
                <LinkIcon size={18} />
              </span>
              <Input
                type="url"
                id="distributeUrl"
                {...register('distributeUrl')}
                placeholder="https://..."
                className={styles.form_urlInput}
              />
            </div>
          </FormField>

          {showImportBanner && (
            <aside
              role="note"
              aria-live="polite"
              className={styles.form_importBanner}
            >
              <div className={styles.form_importBanner_content}>
                <Info
                  size={18}
                  weight="fill"
                  className={styles.form_importBanner_icon}
                />
                <span className={styles.form_importBanner_text}>
                  このサイトで配布されているシナリオはインポートから登録してください
                </span>
              </div>
              <Button variant="outline" status="primary" asChild>
                <Link
                  href={`/scenarios/import?url=${encodeURIComponent(distributeUrl ?? '')}`}
                >
                  インポートへ移動
                </Link>
              </Button>
            </aside>
          )}
        </div>

        {/* フッター */}
        <hr className={styles.form_divider} />
        <div className={styles.form_footer}>
          <Button type="button" variant="ghost" onClick={handleCancel}>
            キャンセル
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
