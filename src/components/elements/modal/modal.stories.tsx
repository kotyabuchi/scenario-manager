import { useState } from 'react';

import { Modal } from './modal';

import { Button } from '@/components/elements/button/button';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Modal> = {
  title: 'UI/Modal',
  component: Modal,
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'モーダルのタイトル',
    },
    open: {
      control: 'boolean',
      description: '開閉状態',
    },
  },
};

export default meta;

type Story = StoryObj<typeof Modal>;

/**
 * デフォルト
 */
export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>モーダルを開く</Button>
        <Modal
          open={open}
          onOpenChange={(details) => setOpen(details.open)}
          title="確認"
        >
          <p>モーダルの内容がここに表示されます。</p>
        </Modal>
      </>
    );
  },
};

/**
 * フッター付き
 */
export const WithFooter: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>フッター付きモーダル</Button>
        <Modal
          open={open}
          onOpenChange={(details) => setOpen(details.open)}
          title="削除の確認"
          footer={
            <div
              style={{
                display: 'flex',
                gap: '8px',
                justifyContent: 'flex-end',
              }}
            >
              <Button variant="outline" onClick={() => setOpen(false)}>
                キャンセル
              </Button>
              <Button status="danger" onClick={() => setOpen(false)}>
                削除する
              </Button>
            </div>
          }
        >
          <p>この操作は取り消せません。本当に削除しますか？</p>
        </Modal>
      </>
    );
  },
};

/**
 * 長いコンテンツ
 */
export const LongContent: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>長いコンテンツ</Button>
        <Modal
          open={open}
          onOpenChange={(details) => setOpen(details.open)}
          title="利用規約"
        >
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {Array.from({ length: 20 }).map((_, i) => (
              <p key={`paragraph-${i + 1}`} style={{ marginBottom: '16px' }}>
                これはダミーテキストです。利用規約の内容がここに表示されます。
                ユーザーは本サービスを利用することで、以下の条件に同意したものとみなされます。
              </p>
            ))}
          </div>
        </Modal>
      </>
    );
  },
};
