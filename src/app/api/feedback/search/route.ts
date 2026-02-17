import { type NextRequest, NextResponse } from 'next/server';
import { isNil } from 'ramda';

import { searchFeedbacks } from '@/app/(main)/feedback/adapter';
import { extractValues, FeedbackCategories, FeedbackStatuses } from '@/db/enum';
import { createClient } from '@/lib/supabase/server';

import type { FeedbackSearchParams } from '@/app/(main)/feedback/interface';

const VALID_STATUSES: readonly string[] = extractValues(FeedbackStatuses);
const VALID_CATEGORIES: readonly string[] = extractValues(FeedbackCategories);

export const dynamic = 'force-dynamic';

const VALID_SORT_OPTIONS = ['votes', 'newest', 'comments'] as const;
type ValidSortOption = (typeof VALID_SORT_OPTIONS)[number];

const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  // 認証チェック
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;

  const params: FeedbackSearchParams = {};

  const category = searchParams.get('category');
  if (
    !isNil(category) &&
    category !== '' &&
    VALID_CATEGORIES.includes(category)
  ) {
    params.category = category;
  }

  const statuses = searchParams.get('statuses');
  if (!isNil(statuses) && statuses !== '') {
    params.statuses = statuses
      .split(',')
      .filter((s) => VALID_STATUSES.includes(s));
  }

  const q = searchParams.get('q');
  if (!isNil(q) && q !== '') {
    params.q = q;
  }

  const mine = searchParams.get('mine');
  if (mine === 'true') {
    params.mine = true;
  }

  // ソートオプションのバリデーション
  const sortParam = searchParams.get('sort');
  const sort: ValidSortOption =
    sortParam && VALID_SORT_OPTIONS.includes(sortParam as ValidSortOption)
      ? (sortParam as ValidSortOption)
      : 'votes';

  // limit/offset の上限チェック
  const rawLimit = Number.parseInt(searchParams.get('limit') ?? '20', 10);
  const rawOffset = Number.parseInt(searchParams.get('offset') ?? '0', 10);
  const limit = Math.min(
    Math.max(Number.isNaN(rawLimit) ? 20 : rawLimit, 1),
    MAX_LIMIT,
  );
  const offset = Math.max(Number.isNaN(rawOffset) ? 0 : rawOffset, 0);

  // ログイン中のユーザーIDを取得（投票済みフラグ・自分の投稿フィルタ用）
  let userId: string | undefined;
  const { data: user } = await supabase
    .from('users')
    .select('user_id')
    .eq('discord_id', authUser.id)
    .maybeSingle();
  userId = user?.user_id;

  if (params.mine && userId) {
    params.userId = userId;
  }

  const result = await searchFeedbacks(params, sort, limit, offset, userId);

  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json(result.data);
}
