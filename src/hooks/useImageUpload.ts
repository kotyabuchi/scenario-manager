import { useState } from 'react';
import { isNil } from 'ramda';

import { resizeImage } from '@/lib/image';

import type { FileUploadFileAcceptDetails } from '@/components/elements/file-upload';

type UseImageUploadOptions = {
  /** React Hook Form の setValue 関数 */
  setImageValue: (file: File | null) => void;
  /** 画像URL をクリアするコールバック */
  clearImageUrl?: () => void;
};

/**
 * 画像アップロード処理を管理するカスタムフック
 *
 * リサイズ、プレビューURL管理、Object URLのクリーンアップを担当
 */
export const useImageUpload = ({
  setImageValue,
  clearImageUrl,
}: UseImageUploadOptions) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleImageSelect = async (details: FileUploadFileAcceptDetails) => {
    const file = details.files[0];
    if (!file) return;

    try {
      const resizedFile = await resizeImage(file, {
        size: 600,
        quality: 0.8,
        format: 'image/jpeg',
      });

      setImageValue(resizedFile);
      if (!isNil(previewUrl)) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(resizedFile));
    } catch {
      setImageValue(file);
      if (!isNil(previewUrl)) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleImageRemove = () => {
    if (!isNil(previewUrl)) {
      URL.revokeObjectURL(previewUrl);
    }
    setImageValue(null);
    setPreviewUrl(null);
    clearImageUrl?.();
  };

  /** Object URLのクリーンアップ（フォーム送信成功時に呼ぶ） */
  const cleanupPreview = () => {
    if (!isNil(previewUrl)) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  return {
    previewUrl,
    handleImageSelect,
    handleImageRemove,
    cleanupPreview,
  };
};
