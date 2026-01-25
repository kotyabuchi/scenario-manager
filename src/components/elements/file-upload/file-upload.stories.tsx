import { FileUpload } from './file-upload';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof FileUpload> = {
  title: 'UI/FileUpload',
  component: FileUpload,
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'ラベル',
    },
    dropzoneText: {
      control: 'text',
      description: 'ドロップゾーンのテキスト',
    },
    hint: {
      control: 'text',
      description: 'ヒントテキスト',
    },
    maxFiles: {
      control: 'number',
      description: '最大ファイル数',
    },
    multiple: {
      control: 'boolean',
      description: '複数選択',
    },
    disabled: {
      control: 'boolean',
      description: '無効状態',
    },
    compact: {
      control: 'boolean',
      description: 'コンパクトモード',
    },
  },
};

export default meta;

type Story = StoryObj<typeof FileUpload>;

/**
 * デフォルト
 */
export const Default: Story = {
  args: {
    dropzoneText: 'ファイルをドラッグ&ドロップ',
    hint: 'PNG, JPG, PDF (最大10MB)',
  },
};

/**
 * ラベル付き
 */
export const WithLabel: Story = {
  args: {
    label: 'シナリオファイル',
    dropzoneText: 'PDFファイルをドラッグ&ドロップ',
    hint: 'PDF形式のみ (最大50MB)',
    accept: 'application/pdf',
  },
};

/**
 * 画像アップロード
 */
export const ImageUpload: Story = {
  args: {
    label: 'サムネイル画像',
    dropzoneText: '画像をドラッグ&ドロップ',
    hint: 'PNG, JPG, GIF (最大5MB, 推奨サイズ: 1200x630)',
    accept: 'image/*',
    maxFileSize: 5 * 1024 * 1024,
  },
};

/**
 * 複数ファイル
 */
export const MultipleFiles: Story = {
  args: {
    label: '参考資料',
    dropzoneText: 'ファイルをドラッグ&ドロップ',
    hint: '最大5ファイルまで',
    maxFiles: 5,
    multiple: true,
  },
};

/**
 * コンパクトモード
 */
export const Compact: Story = {
  args: {
    dropzoneText: 'ファイルを選択',
    compact: true,
  },
};

/**
 * 無効状態
 */
export const Disabled: Story = {
  args: {
    dropzoneText: 'ファイルをアップロードできません',
    disabled: true,
  },
};

/**
 * カスタムファイルタイプ
 */
export const CustomAccept: Story = {
  args: {
    label: 'ドキュメント',
    dropzoneText: 'ドキュメントをドラッグ&ドロップ',
    hint: 'Word, Excel, PowerPoint, PDF',
    accept: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
  },
};

/**
 * ファイルサイズ制限
 */
export const WithSizeLimit: Story = {
  args: {
    label: 'アイコン画像',
    dropzoneText: '画像をドラッグ&ドロップ',
    hint: 'PNG, JPG (最大1MB)',
    accept: 'image/*',
    maxFileSize: 1 * 1024 * 1024,
  },
};
