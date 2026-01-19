import { NextResponse } from 'next/server';

import {
  getCurrentUserId,
  getUpcomingSessions,
} from '@/app/(main)/sessions/adapter';

import type { NextRequest } from 'next/server';
import type { UpcomingSortOption } from '@/app/(main)/sessions/interface';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const sort = (searchParams.get('sort') ?? 'date_asc') as UpcomingSortOption;
  const limit = Number(searchParams.get('limit') ?? '20');
  const offset = Number(searchParams.get('offset') ?? '0');

  // ログインユーザーIDを取得
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await getUpcomingSessions(userId, sort, limit, offset);

  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json(result.data);
}
