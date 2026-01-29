import { getCloudflareContext } from '@opennextjs/cloudflare';
import { type NextRequest, NextResponse } from 'next/server';

import { getAppLogger } from '@/lib/logger';

type CloudflareEnv = {
  SCENARIO_IMAGES?: R2Bucket;
};

/**
 * 画像をCloudflare R2にアップロードするAPI
 *
 * @example
 * const formData = new FormData()
 * formData.append('file', file)
 * const res = await fetch('/api/upload', { method: 'POST', body: formData })
 * const { url } = await res.json()
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが見つかりません' },
        { status: 400 },
      );
    }

    // ファイルタイプの検証
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            '許可されていないファイル形式です。JPEG, PNG, WebP, GIFのみ対応しています。',
        },
        { status: 400 },
      );
    }

    // ファイルサイズの検証（5MB）
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'ファイルサイズが大きすぎます。5MB以下にしてください。' },
        { status: 400 },
      );
    }

    // ローカル開発環境ではR2が利用できないため、ダミーURLを返す
    if (process.env.NODE_ENV === 'development') {
      getAppLogger(['app', 'upload'])
        .warn`R2 bucket not available in development, returning placeholder URL`;
      return NextResponse.json({
        url: `https://placehold.co/600x600/eee/999?text=${encodeURIComponent('Preview')}`,
        key: `dev/${Date.now()}-${file.name}`,
      });
    }

    // Cloudflare R2バケットを取得（本番環境のみ）
    const { env } = getCloudflareContext();
    const bucket = (env as CloudflareEnv).SCENARIO_IMAGES;

    if (!bucket) {
      return NextResponse.json(
        { error: 'ストレージが設定されていません' },
        { status: 500 },
      );
    }

    // ユニークなキーを生成
    const timestamp = Date.now();
    const ext = file.name.split('.').pop() || 'jpg';
    const key = `scenarios/${timestamp}-${crypto.randomUUID()}.${ext}`;

    // R2にアップロード
    const arrayBuffer = await file.arrayBuffer();
    await bucket.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // 公開URLを構築
    const r2PublicUrl =
      process.env.R2_PUBLIC_URL ??
      'https://pub-f95dd6b93a8642b39889342b87ba0852.r2.dev';
    const publicUrl = `${r2PublicUrl}/${key}`;

    return NextResponse.json({
      url: publicUrl,
      key,
    });
  } catch (error) {
    getAppLogger(['app', 'upload']).error`Upload error: ${error}`;
    return NextResponse.json(
      { error: 'アップロードに失敗しました' },
      { status: 500 },
    );
  }
}
