/**
 * 画像のリサイズ・圧縮ユーティリティ
 */

type ResizeOptions = {
  /** 出力サイズ（正方形） */
  size?: number;
  /** JPEG品質（0-1） */
  quality?: number;
  /** 出力形式 */
  format?: 'image/jpeg' | 'image/webp';
};

const DEFAULT_OPTIONS: Required<ResizeOptions> = {
  size: 600,
  quality: 0.8,
  format: 'image/jpeg',
};

/**
 * 画像ファイルを読み込んでImageオブジェクトを返す
 */
const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('画像の読み込みに失敗しました'));
    };
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Canvasを使って画像をリサイズ（センタークロップ）
 */
const resizeWithCanvas = (
  img: HTMLImageElement,
  size: number,
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context の取得に失敗しました');
  }

  // アスペクト比を維持してセンタークロップ
  const srcSize = Math.min(img.width, img.height);
  const srcX = (img.width - srcSize) / 2;
  const srcY = (img.height - srcSize) / 2;

  // 高品質なリサイズのための設定
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, size, size);

  return canvas;
};

/**
 * CanvasをBlobに変換
 */
const canvasToBlob = (
  canvas: HTMLCanvasElement,
  format: string,
  quality: number,
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('画像の変換に失敗しました'));
        }
      },
      format,
      quality,
    );
  });
};

/**
 * 画像ファイルをリサイズ・圧縮する
 *
 * @param file - 元の画像ファイル
 * @param options - リサイズオプション
 * @returns リサイズ・圧縮された画像ファイル
 *
 * @example
 * const resizedFile = await resizeImage(originalFile, { size: 600, quality: 0.8 });
 */
export const resizeImage = async (
  file: File,
  options: ResizeOptions = {},
): Promise<File> => {
  const { size, quality, format } = { ...DEFAULT_OPTIONS, ...options };

  // 画像を読み込み
  const img = await loadImage(file);

  // 元画像が指定サイズ以下の場合はそのまま返す（ただし形式は変換）
  const needsResize = img.width > size || img.height > size;
  const targetSize = needsResize ? size : Math.min(img.width, img.height);

  // リサイズ
  const canvas = resizeWithCanvas(img, targetSize);

  // 圧縮してBlobに変換
  const blob = await canvasToBlob(canvas, format, quality);

  // 拡張子を決定
  const ext = format === 'image/webp' ? 'webp' : 'jpg';
  const baseName = file.name.replace(/\.[^.]+$/, '');

  // Fileオブジェクトとして返す
  return new File([blob], `${baseName}.${ext}`, { type: format });
};

/**
 * 画像リサイズのデフォルト設定
 */
export const IMAGE_RESIZE_CONFIG = {
  size: DEFAULT_OPTIONS.size,
  quality: DEFAULT_OPTIONS.quality,
  format: DEFAULT_OPTIONS.format,
  maxOriginalSize: 5 * 1024 * 1024, // 5MB
} as const;
