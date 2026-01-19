import { NextResponse } from 'next/server';

import {
  getCurrentUserId,
  getHistorySessions,
} from '@/app/(main)/sessions/adapter';

import type { NextRequest } from 'next/server';
import type {
  HistorySortOption,
  RoleFilterValue,
  StatusFilterValue,
} from '@/app/(main)/sessions/interface';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const sort = (searchParams.get('sort') ?? 'date_desc') as HistorySortOption;
  const rolesParam = searchParams.get('roles');
  const roles = rolesParam
    ? (rolesParam.split(',').filter(Boolean) as RoleFilterValue[])
    : [];
  const statusesParam = searchParams.get('statuses');
  const statuses = statusesParam
    ? (statusesParam.split(',').filter(Boolean) as StatusFilterValue[])
    : [];
  const systemsParam = searchParams.get('systems');
  const systems = systemsParam ? systemsParam.split(',').filter(Boolean) : [];
  const limit = Number(searchParams.get('limit') ?? '20');
  const offset = Number(searchParams.get('offset') ?? '0');

  // ログインユーザーIDを取得
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await getHistorySessions(
    userId,
    roles,
    statuses,
    systems,
    sort,
    limit,
    offset,
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json(result.data);
}
