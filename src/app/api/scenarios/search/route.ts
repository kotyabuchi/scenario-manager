import { type NextRequest, NextResponse } from 'next/server';
import { isNil } from 'ramda';

import { searchScenarios } from '@/app/(main)/scenarios/adapter';

import type {
  SearchParams,
  SortOption,
} from '@/app/(main)/scenarios/interface';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  // クエリパラメータをパース
  const params: SearchParams = {};

  const systems = searchParams.get('systems');
  if (!isNil(systems) && systems !== '') {
    params.systemIds = systems.split(',');
  }

  const tagIds = searchParams.get('tags');
  if (!isNil(tagIds) && tagIds !== '') {
    params.tagIds = tagIds.split(',');
  }

  const minPlayer = searchParams.get('minPlayer');
  const maxPlayer = searchParams.get('maxPlayer');
  if (!isNil(minPlayer) || !isNil(maxPlayer)) {
    params.playerCount = {
      min: minPlayer ? Number.parseInt(minPlayer, 10) : 1,
      max: maxPlayer ? Number.parseInt(maxPlayer, 10) : 20,
    };
  }

  const minPlaytime = searchParams.get('minPlaytime');
  const maxPlaytime = searchParams.get('maxPlaytime');
  if (!isNil(minPlaytime) || !isNil(maxPlaytime)) {
    params.playtime = {
      min: minPlaytime ? Number.parseInt(minPlaytime, 10) : 1,
      max: maxPlaytime ? Number.parseInt(maxPlaytime, 10) : 24,
    };
  }

  const scenarioName = searchParams.get('q');
  if (!isNil(scenarioName) && scenarioName !== '') {
    params.scenarioName = scenarioName;
  }

  const sort = (searchParams.get('sort') as SortOption) ?? 'newest';
  const limit = Number.parseInt(searchParams.get('limit') ?? '20', 10);
  const offset = Number.parseInt(searchParams.get('offset') ?? '0', 10);

  const result = await searchScenarios(params, sort, limit, offset);

  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json(result.data);
}
