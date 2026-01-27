'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from 'lucide-react';
import Image from 'next/image';
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
import {
  FileUpload,
  type FileUploadFileAcceptDetails,
} from '@/components/elements/file-upload';
import { FormField } from '@/components/elements/form-field';
import { Input } from '@/components/elements/input';
import {
  NumberInput,
  type NumberInputValueChangeDetails,
} from '@/components/elements/number-input';
import {
  Select,
  type SelectValueChangeDetails,
} from '@/components/elements/select';
import {
  Slider,
  type SliderValueChangeDetails,
} from '@/components/elements/slider';
import { Textarea } from '@/components/elements/textarea';
import { HandoutTypes } from '@/db/enum';
import { useSystemMessage } from '@/hooks/useSystemMessage';
import { resizeImage } from '@/lib/image';

import type { ScenarioSystem, Tag } from '../../interface';

type ScenarioFormProps = {
  systems: ScenarioSystem[];
  tags: Tag[];
};

export const ScenarioForm = ({ systems, tags }: ScenarioFormProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { showError, showSuccess } = useSystemMessage();

  // 画像プレビュー用の状態
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // スライダー用の状態
  const [playerRange, setPlayerRange] = useState<[number, number]>([1, 4]);
  const [playtimeRange, setPlaytimeRange] = useState<[number, number]>([
    60, 180,
  ]);

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
      minPlaytime: undefined,
      maxPlaytime: undefined,
      scenarioImage: null,
      scenarioImageUrl: '',
      distributeUrl: '',
      tagIds: [],
    },
  });

  const selectedSystemId = watch('scenarioSystemId');
  const selectedTagIds = watch('tagIds') as string[];
  const selectedHandoutType = watch('handoutType');

  // システム選択変更
  const handleSystemChange = (
    details: SelectValueChangeDetails<{ label: string; value: string }>,
  ) => {
    const value = details.value[0];
    if (!isNil(value)) {
      setValue('scenarioSystemId', value);
    }
  };

  // ハンドアウト選択変更
  const handleHandoutChange = (
    details: SelectValueChangeDetails<{ label: string; value: string }>,
  ) => {
    const value = details.value[0];
    if (!isNil(value)) {
      setValue('handoutType', value as 'NONE' | 'PUBLIC' | 'SECRET');
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

  // プレイ人数スライダー変更
  const handlePlayerSliderChange = (details: SliderValueChangeDetails) => {
    const [min, max] = details.value;
    setPlayerRange([min ?? 1, max ?? 4]);
    setValue('minPlayer', min);
    setValue('maxPlayer', max);
  };

  // プレイ時間スライダー変更
  const handlePlaytimeSliderChange = (details: SliderValueChangeDetails) => {
    const [min, max] = details.value;
    setPlaytimeRange([min ?? 60, max ?? 180]);
    setValue('minPlaytime', min);
    setValue('maxPlaytime', max);
  };

  // NumberInput変更ハンドラ（スライダーと連動）
  const handleMinPlayerChange = (details: NumberInputValueChangeDetails) => {
    const val = details.valueAsNumber;
    if (!Number.isNaN(val)) {
      setPlayerRange([val, playerRange[1]]);
      setValue('minPlayer', val);
    }
  };

  const handleMaxPlayerChange = (details: NumberInputValueChangeDetails) => {
    const val = details.valueAsNumber;
    if (!Number.isNaN(val)) {
      setPlayerRange([playerRange[0], val]);
      setValue('maxPlayer', val);
    }
  };

  const handleMinPlaytimeChange = (details: NumberInputValueChangeDetails) => {
    const val = details.valueAsNumber;
    if (!Number.isNaN(val)) {
      setPlaytimeRange([val, playtimeRange[1]]);
      setValue('minPlaytime', val);
    }
  };

  const handleMaxPlaytimeChange = (details: NumberInputValueChangeDetails) => {
    const val = details.valueAsNumber;
    if (!Number.isNaN(val)) {
      setPlaytimeRange([playtimeRange[0], val]);
      setValue('maxPlaytime', val);
    }
  };

  // 画像選択処理（リサイズ・プレビュー）
  const handleImageSelect = async (details: FileUploadFileAcceptDetails) => {
    const file = details.files[0];
    if (!file) return;

    try {
      // 600x600px、JPEG 80%にリサイズ・圧縮
      const resizedFile = await resizeImage(file, {
        size: 600,
        quality: 0.8,
        format: 'image/jpeg',
      });

      // React Hook Formでファイルを管理
      setValue('scenarioImage', resizedFile, { shouldValidate: true });

      // プレビュー用のObject URLを生成
      if (!isNil(previewUrl)) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(resizedFile));
    } catch {
      // リサイズに失敗した場合は元のファイルを使用
      setValue('scenarioImage', file, { shouldValidate: true });
      if (!isNil(previewUrl)) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // 画像削除処理
  const handleImageRemove = () => {
    if (!isNil(previewUrl)) {
      URL.revokeObjectURL(previewUrl);
    }
    setValue('scenarioImage', null);
    setPreviewUrl(null);
    setValue('scenarioImageUrl', '');
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
            showError(uploadResult.error ?? '画像のアップロードに失敗しました');
            return;
          }

          imageUrl = uploadResult.url ?? '';
        } catch {
          showError('画像のアップロードに失敗しました');
          return;
        }
      }

      const result = await createScenarioAction({
        ...data,
        scenarioImageUrl: imageUrl,
      });

      if (!result.success) {
        showError(result.error?.message ?? '登録に失敗しました');
      } else {
        // プレビューURLをクリーンアップ
        if (!isNil(previewUrl)) {
          URL.revokeObjectURL(previewUrl);
        }
        showSuccess('シナリオを登録しました');
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

  // ハンドアウト選択肢
  const handoutItems = Object.values(HandoutTypes).map((type) => ({
    label: type.label,
    value: type.value,
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
        {/* トップ行: 画像 + フィールド群 */}
        <div className={styles.form_topRow}>
          {/* 画像アップロード */}
          <div className={styles.form_imageRow}>
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
                />
                <FieldError error={errors.scenarioImage} />
              </div>
            )}
          </div>

          {/* 右側フィールド群 */}
          <div className={styles.form_rightFields}>
            {/* シナリオ名 + 作者名 */}
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
                <Input
                  id="author"
                  {...register('author')}
                  placeholder="作者名を入力（任意）"
                  maxLength={100}
                />
              </FormField>
            </div>

            {/* システム + ハンドアウト */}
            <div className={styles.form_fieldRow_narrow}>
              <FormField
                label="シナリオシステム"
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

              <FormField label="ハンドアウトタイプ" error={errors.handoutType}>
                <Select
                  items={handoutItems}
                  value={selectedHandoutType ? [selectedHandoutType] : []}
                  onValueChange={handleHandoutChange}
                  placeholder="なし"
                />
              </FormField>
            </div>

            {/* プレイ人数 + プレイ時間 */}
            <div className={styles.form_fieldRow}>
              {/* プレイ人数 */}
              <div className={styles.form_field}>
                <span className={styles.form_label}>プレイ人数</span>
                <div className={styles.form_sliderControls}>
                  <Slider
                    value={playerRange}
                    onValueChange={handlePlayerSliderChange}
                    min={1}
                    max={20}
                    step={1}
                    range
                  />
                  <div className={styles.form_sliderMinMax}>
                    <span>1</span>
                    <span>20+</span>
                  </div>
                  <div className={styles.form_sliderValue}>
                    {playerRange[0]} 〜 {playerRange[1]} 人
                  </div>
                  <div className={styles.form_rangeInputRow}>
                    <NumberInput
                      value={String(playerRange[0])}
                      onValueChange={handleMinPlayerChange}
                      min={1}
                      max={20}
                      placeholder="最小"
                    />
                    <span className={styles.form_rangeSeparator}>〜</span>
                    <NumberInput
                      value={String(playerRange[1])}
                      onValueChange={handleMaxPlayerChange}
                      min={1}
                      max={20}
                      placeholder="最大"
                    />
                    <span className={styles.form_rangeUnit}>人</span>
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
                    value={playtimeRange}
                    onValueChange={handlePlaytimeSliderChange}
                    min={30}
                    max={480}
                    step={30}
                    range
                  />
                  <div className={styles.form_sliderMinMax}>
                    <span>30</span>
                    <span>480+</span>
                  </div>
                  <div className={styles.form_sliderValue}>
                    {playtimeRange[0]} 〜 {playtimeRange[1]} 分
                  </div>
                  <div className={styles.form_rangeInputRow}>
                    <NumberInput
                      value={String(playtimeRange[0])}
                      onValueChange={handleMinPlaytimeChange}
                      min={30}
                      max={480}
                      step={30}
                      placeholder="最小"
                    />
                    <span className={styles.form_rangeSeparator}>〜</span>
                    <NumberInput
                      value={String(playtimeRange[1])}
                      onValueChange={handleMaxPlaytimeChange}
                      min={30}
                      max={480}
                      step={30}
                      placeholder="最大"
                    />
                    <span className={styles.form_rangeUnit}>分</span>
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
              <Input
                type="url"
                id="distributeUrl"
                {...register('distributeUrl')}
                placeholder="https://..."
              />
            </FormField>

            {/* タグ */}
            <FormField label="タグ">
              {/* 選択済みタグ */}
              {selectedTags.length > 0 && (
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
                </div>
              )}
              {/* 選択可能タグ */}
              {unselectedTags.length > 0 && (
                <div className={styles.form_chips}>
                  {unselectedTags.map((tag) => (
                    <Chip
                      key={tag.tagId}
                      label={tag.name}
                      onClick={() => toggleTag(tag.tagId)}
                    />
                  ))}
                </div>
              )}
            </FormField>
          </div>
        </div>

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

        {/* フッター */}
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
