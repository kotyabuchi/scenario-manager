import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { FileUpload } from './file-upload';

// ヘルパー関数: file inputを取得
const getFileInput = (container: HTMLElement): HTMLInputElement => {
  const input = container.querySelector('input[type="file"]');
  if (!input) throw new Error('File input not found');
  return input as HTMLInputElement;
};

describe('FileUpload', () => {
  it('ドロップゾーンをレンダリングできる', () => {
    render(<FileUpload onFileChange={vi.fn()} />);

    expect(screen.getByText('ファイルをドラッグ&ドロップ')).toBeInTheDocument();
  });

  it('カスタムラベルを表示できる', () => {
    render(
      <FileUpload
        label="画像をアップロード"
        hint="PNG, JPG形式"
        onFileChange={vi.fn()}
      />,
    );

    expect(screen.getByText('画像をアップロード')).toBeInTheDocument();
    expect(screen.getByText('PNG, JPG形式')).toBeInTheDocument();
  });

  it('ファイル選択ボタンをクリックできる', async () => {
    const user = userEvent.setup();

    render(<FileUpload onFileChange={vi.fn()} />);

    const button = screen.getByRole('button', { name: 'ファイルを選択' });
    await user.click(button);

    // ボタンが存在しクリック可能であることを確認
    expect(button).toBeInTheDocument();
  });

  it('ファイルをアップロードするとonFileChangeが呼ばれる', async () => {
    const user = userEvent.setup();
    const handleFileChange = vi.fn();

    const { container } = render(
      <FileUpload onFileChange={handleFileChange} />,
    );

    const input = getFileInput(container);
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

    await user.upload(input, file);

    await waitFor(() => {
      expect(handleFileChange).toHaveBeenCalled();
    });
  });

  it('disabled状態ではアップロードできない', () => {
    render(<FileUpload disabled onFileChange={vi.fn()} />);

    const button = screen.getByRole('button', { name: 'ファイルを選択' });
    expect(button).toBeDisabled();
  });

  it('acceptで許可するファイル形式を制限できる', () => {
    const { container } = render(
      <FileUpload accept="image/*" onFileChange={vi.fn()} />,
    );

    const input = getFileInput(container);
    expect(input).toHaveAttribute('accept', 'image/*');
  });

  it('コンポーネントが正しくレンダリングされる', () => {
    render(
      <FileUpload
        dropzoneText="ここにファイルをドロップ"
        hint="最大5MB"
        maxFiles={3}
        onFileChange={vi.fn()}
      />,
    );

    expect(screen.getByText('ここにファイルをドロップ')).toBeInTheDocument();
    expect(screen.getByText('最大5MB')).toBeInTheDocument();
  });
});
