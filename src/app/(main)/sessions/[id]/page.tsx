import { notFound } from 'next/navigation';

export const metadata = {
  title: 'セッション詳細',
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SessionDetailPage({ params }: PageProps) {
  const { id } = await params;

  // TODO: Implement session detail page
  if (!id) {
    notFound();
  }

  return (
    <div>
      <h1>セッション詳細: {id}</h1>
      <p>この機能は準備中です。</p>
    </div>
  );
}
