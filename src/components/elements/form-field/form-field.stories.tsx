import { Chip } from '../Chip';
import { Input } from '../input';
import { Textarea } from '../textarea';
import { FormField } from './form-field';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'UI/FormField',
  component: FormField,
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'ラベルテキスト',
    },
    id: {
      control: 'text',
      description: '入力要素のID（指定時はlabel要素を使用）',
    },
    required: {
      control: 'boolean',
      description: '必須マーク表示',
    },
    hint: {
      control: 'text',
      description: 'ヒントテキスト',
    },
    error: {
      control: 'object',
      description: 'エラーオブジェクト',
    },
  },
} satisfies Meta<typeof FormField>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * テキスト入力フィールド（単一入力）
 */
export const WithInput: Story = {
  args: {
    label: 'シナリオ名',
    id: 'name',
    required: true,
    children: null,
  },
  render: (args) => (
    <FormField {...args}>
      <Input id={args.id} placeholder="シナリオ名を入力" />
    </FormField>
  ),
};

/**
 * テキストエリア（単一入力）
 */
export const WithTextarea: Story = {
  args: {
    label: '概要',
    id: 'description',
    hint: '2000文字以内',
    children: null,
  },
  render: (args) => (
    <FormField {...args}>
      <Textarea id={args.id} placeholder="シナリオの概要を入力" />
    </FormField>
  ),
};

/**
 * エラー表示
 */
export const WithError: Story = {
  args: {
    label: 'シナリオ名',
    id: 'name',
    required: true,
    error: { message: 'シナリオ名は必須です' },
    children: null,
  },
  render: (args) => (
    <FormField {...args}>
      <Input id={args.id} placeholder="シナリオ名を入力" />
    </FormField>
  ),
};

/**
 * グループ入力（fieldset/legend使用）
 * idを指定しない場合、fieldset/legendでラップされる
 */
export const FieldGroup: Story = {
  args: {
    label: 'システム',
    required: true,
    children: null,
  },
  render: (args) => (
    <FormField {...args}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <Chip label="クトゥルフ神話TRPG" selected />
        <Chip label="エモクロアTRPG" />
        <Chip label="ダブルクロス" />
      </div>
    </FormField>
  ),
};

/**
 * グループ入力（エラーあり）
 */
export const FieldGroupWithError: Story = {
  args: {
    label: 'システム',
    required: true,
    error: { message: 'システムを選択してください' },
    children: null,
  },
  render: (args) => (
    <FormField {...args}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <Chip label="クトゥルフ神話TRPG" />
        <Chip label="エモクロアTRPG" />
        <Chip label="ダブルクロス" />
      </div>
    </FormField>
  ),
};

/**
 * ヒント付きフィールド
 */
export const WithHint: Story = {
  args: {
    label: 'サムネイルURL',
    id: 'thumbnailUrl',
    hint: 'HTTPS形式のURLを入力してください',
    children: null,
  },
  render: (args) => (
    <FormField {...args}>
      <Input
        id={args.id}
        type="url"
        placeholder="https://example.com/image.jpg"
      />
    </FormField>
  ),
};
