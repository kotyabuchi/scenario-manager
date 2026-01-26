'use client';

import {
  FileUpload as ArkFileUpload,
  type FileUploadFileAcceptDetails,
  type FileUploadFileChangeDetails,
  type FileUploadFileRejectDetails,
  type FileUploadRootProps,
} from '@ark-ui/react/file-upload';
import { File, Trash2, Upload } from 'lucide-react';
import { isNil } from 'ramda';

import * as styles from './styles';

type FileUploadProps = {
  /** ファイル変更時のコールバック */
  onFileChange?: (details: FileUploadFileChangeDetails) => void;
  /** ファイル受け入れ時のコールバック */
  onFileAccept?: (details: FileUploadFileAcceptDetails) => void;
  /** ファイル拒否時のコールバック */
  onFileReject?: (details: FileUploadFileRejectDetails) => void;
  /** 許可するファイルタイプ（MIME type） */
  accept?: string | string[];
  /** 最大ファイルサイズ（バイト） */
  maxFileSize?: number;
  /** 最大ファイル数 */
  maxFiles?: number;
  /** 複数選択を許可 */
  multiple?: boolean;
  /** ラベル */
  label?: string;
  /** ドロップゾーンのテキスト */
  dropzoneText?: string;
  /** ヒントテキスト */
  hint?: string;
  /** 無効状態 */
  disabled?: boolean;
  /** 入力要素の名前 */
  name?: string;
  /** コンパクトモード（ドロップゾーンを小さく） */
  compact?: boolean;
} & Omit<FileUploadRootProps, 'onFileChange' | 'onFileAccept' | 'onFileReject'>;

/**
 * ファイルサイズをフォーマット
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
};

/**
 * ファイルアップロードコンポーネント
 *
 * Ark UI FileUploadをベースに、プロジェクトのデザインシステムに合わせてスタイリング
 *
 * @example
 * <FileUpload
 *   onFileChange={(details) => setFiles(details.acceptedFiles)}
 *   accept="image/*"
 *   maxFileSize={5 * 1024 * 1024} // 5MB
 *   maxFiles={3}
 *   dropzoneText="画像をドラッグ＆ドロップ"
 *   hint="PNG, JPG, GIF (最大5MB)"
 * />
 */
export const FileUpload = ({
  onFileChange,
  onFileAccept,
  onFileReject,
  accept,
  maxFileSize,
  maxFiles = 1,
  multiple = false,
  label,
  dropzoneText = 'ファイルをドラッグ&ドロップ',
  hint,
  disabled,
  name,
  compact = false,
  ...rest
}: FileUploadProps) => {
  const acceptArray = isNil(accept)
    ? undefined
    : Array.isArray(accept)
      ? accept
      : [accept];

  return (
    <ArkFileUpload.Root
      onFileChange={onFileChange}
      onFileAccept={onFileAccept}
      onFileReject={onFileReject}
      accept={acceptArray}
      maxFileSize={maxFileSize}
      maxFiles={maxFiles}
      disabled={disabled}
      name={name}
      className={styles.fileUpload_root}
      {...rest}
    >
      {!isNil(label) && (
        <ArkFileUpload.Label className={styles.fileUpload_label}>
          {label}
        </ArkFileUpload.Label>
      )}
      <ArkFileUpload.Dropzone className={styles.fileUpload_dropzone}>
        <Upload size={compact ? 20 : 32} className={styles.fileUpload_icon} />
        <div className={styles.fileUpload_text}>{dropzoneText}</div>
        {!isNil(hint) && <div className={styles.fileUpload_hint}>{hint}</div>}
        <ArkFileUpload.Trigger className={styles.fileUpload_trigger}>
          ファイルを選択
        </ArkFileUpload.Trigger>
      </ArkFileUpload.Dropzone>

      <ArkFileUpload.ItemGroup className={styles.fileUpload_itemGroup}>
        <ArkFileUpload.Context>
          {(context) =>
            context.acceptedFiles.map((file) => (
              <ArkFileUpload.Item key={file.name} file={file}>
                <div className={styles.fileUpload_item}>
                  <ArkFileUpload.ItemPreview
                    type="image/*"
                    className={styles.fileUpload_itemPreview}
                  >
                    <ArkFileUpload.ItemPreviewImage />
                  </ArkFileUpload.ItemPreview>
                  <ArkFileUpload.ItemPreview
                    type=".*"
                    className={styles.fileUpload_itemPreview}
                  >
                    <File
                      size={20}
                      className={styles.fileUpload_itemPreviewIcon}
                    />
                  </ArkFileUpload.ItemPreview>
                  <div className={styles.fileUpload_itemInfo}>
                    <ArkFileUpload.ItemName
                      className={styles.fileUpload_itemName}
                    />
                    <div className={styles.fileUpload_itemSize}>
                      {formatFileSize(file.size)}
                    </div>
                  </div>
                  <ArkFileUpload.ItemDeleteTrigger
                    className={styles.fileUpload_itemDeleteTrigger}
                  >
                    <Trash2 size={16} />
                  </ArkFileUpload.ItemDeleteTrigger>
                </div>
              </ArkFileUpload.Item>
            ))
          }
        </ArkFileUpload.Context>
      </ArkFileUpload.ItemGroup>

      <ArkFileUpload.HiddenInput />
    </ArkFileUpload.Root>
  );
};

export type {
  FileUploadProps,
  FileUploadFileChangeDetails,
  FileUploadFileAcceptDetails,
  FileUploadFileRejectDetails,
};
