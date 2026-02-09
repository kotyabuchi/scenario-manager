import { useEffect } from 'react';
import { useSetAtom } from 'jotai';

import { SystemMessage } from './SystemMessage';

import { Button } from '@/components/elements/button/button';
import { JotaiProvider } from '@/components/providers/JotaiProvider';
import { useSystemMessageActions } from '@/hooks/useSystemMessage';
import { type MessageLevel, systemMessagesAtom } from '@/store/systemMessage';
import { css } from '@/styled-system/css';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Blocks/SystemMessage',
  component: SystemMessage,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <JotaiProvider>
        <Story />
      </JotaiProvider>
    ),
  ],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof SystemMessage>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 初期状態（メッセージなし）
 */
export const Default: Story = {};

/**
 * 複数メッセージが表示された状態
 */
const WithMessagesWrapper = () => {
  const setMessages = useSetAtom(systemMessagesAtom);

  useEffect(() => {
    setMessages([
      {
        id: '1',
        level: 'success',
        message: '保存が完了しました',
        createdAt: Date.now(),
      },
      {
        id: '2',
        level: 'danger',
        message: 'エラーが発生しました。再度お試しください。',
        createdAt: Date.now(),
      },
      {
        id: '3',
        level: 'warning',
        message: 'セッションの有効期限が近づいています',
        createdAt: Date.now(),
      },
      {
        id: '4',
        level: 'info',
        message: '新しいバージョンが利用可能です',
        createdAt: Date.now(),
      },
    ]);
  }, [setMessages]);

  return <SystemMessage />;
};

export const WithMessages: Story = {
  render: () => <WithMessagesWrapper />,
};

/**
 * インタラクティブ - ボタンでメッセージを追加/削除できる
 */
const InteractiveWrapper = () => {
  const { addMessage, clearAll } = useSystemMessageActions();

  const handleAddMessage = (level: MessageLevel) => {
    const messages: Record<MessageLevel, string> = {
      success: '操作が正常に完了しました',
      danger: 'エラーが発生しました',
      warning: '警告: 入力内容を確認してください',
      info: 'お知らせ: 新機能が追加されました',
    };
    addMessage(level, messages[level]);
  };

  return (
    <div
      className={css({ display: 'flex', flexDirection: 'column', gap: '4' })}
    >
      <div className={css({ display: 'flex', gap: '2', flexWrap: 'wrap' })}>
        <Button
          variant="solid"
          colorPalette="green"
          size="sm"
          onClick={() => handleAddMessage('success')}
        >
          Success を追加
        </Button>
        <Button
          variant="solid"
          colorPalette="red"
          size="sm"
          onClick={() => handleAddMessage('danger')}
        >
          Danger を追加
        </Button>
        <Button
          variant="solid"
          colorPalette="orange"
          size="sm"
          onClick={() => handleAddMessage('warning')}
        >
          Warning を追加
        </Button>
        <Button
          variant="solid"
          colorPalette="blue"
          size="sm"
          onClick={() => handleAddMessage('info')}
        >
          Info を追加
        </Button>
        <Button
          variant="outline"
          colorPalette="gray"
          size="sm"
          onClick={clearAll}
        >
          すべてクリア
        </Button>
      </div>
      <SystemMessage />
    </div>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveWrapper />,
};
