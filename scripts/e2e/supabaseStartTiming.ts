import { isNil } from 'ramda';

import { writeProgressStderr } from './progressStderr';
import { createSupabasePullDiagnostics } from './supabasePullDiagnostics';
import { createSupabasePullTiming } from './supabasePullTiming';

import { stripVTControlCharacters } from 'node:util';

const MAX_LINE_CHARACTERS = 2048;
const START_MARKERS = [
  ['database', /^Starting database(?: from backup)?\.\.\.$/],
  ['schema', /^Initialising schema\.\.\.$/],
  ['globals', /^Seeding globals from .+\.\.\.$/],
  ['migrations', /^Applying migration .+\.\.\.$/],
  ['seed', /^Seeding data from .+\.\.\.$/],
  ['containers', /^Starting containers\.\.\.$/],
  ['health', /^Waiting for health checks\.\.\.$/],
  ['ready', /^Started supabase local development setup\.$/],
] as const;

/** 固定CLIの到達点のみを公開し、stderr本文・path・資格情報を保持しない。 */
export const createSupabaseStartTiming = () => {
  const isEnabled =
    process.env.GITHUB_ACTIONS === 'true' || process.env.E2E_CLI_TIMING === '1';
  if (!isEnabled)
    return {
      observe: (_chunk: string) => {
        // 無効時は時計・parser・bufferを初期化しない。
      },
      close: () => {
        // 有効性は作成時に固定する。
      },
    };
  const pullTiming = createSupabasePullTiming();
  const diagnostics = createSupabasePullDiagnostics();
  let startedAt: number | undefined;
  try {
    const now = performance.now();
    if (Number.isFinite(now)) startedAt = now;
  } catch {
    // 時計の失敗は環境起動に影響させない。
  }
  let line = '';
  let isDiscarding = false;
  let isClosed = false;
  const seen = new Set<string>();
  const flush = () => {
    try {
      if (isDiscarding || isNil(startedAt)) return;
      const clean = stripVTControlCharacters(line).trim();
      if (diagnostics.matchesLine(clean)) {
        const elapsedForDiagnostics = performance.now() - startedAt;
        if (
          Number.isFinite(elapsedForDiagnostics) &&
          elapsedForDiagnostics >= 0
        )
          diagnostics.observeLine(clean, Math.round(elapsedForDiagnostics));
      }
      const marker = START_MARKERS.find(([, pattern]) => pattern.test(clean));
      const isNewMarker = !isNil(marker) && !seen.has(marker[0]);
      if (!isNewMarker && !pullTiming.matchesLine(clean)) return;
      if (isNewMarker && !isNil(marker)) seen.add(marker[0]);
      const elapsed = performance.now() - startedAt;
      if (!Number.isFinite(elapsed) || elapsed < 0) return;
      pullTiming.observeLine(clean, Math.round(elapsed));
      if (!isNewMarker || isNil(marker)) return;
      // 到達点の観測であり、処理区間の成功やhealth検査成功を表さない。
      writeProgressStderr(
        `[supabase-start-timing] ${JSON.stringify({ milestone: marker[0], elapsedMs: Math.round(elapsed) })}\n`,
      );
    } catch {
      // 表示先・時計・parserの失敗を診断の外へ伝えない。
    } finally {
      line = '';
      isDiscarding = false;
    }
  };
  return {
    observe: (chunk: string) => {
      if (isClosed) return;
      for (const character of chunk) {
        if (character === '\n' || character === '\r') flush();
        else if (!isDiscarding) {
          if (line.length + character.length > MAX_LINE_CHARACTERS) {
            line = '';
            isDiscarding = true;
          } else line += character;
        }
      }
    },
    close: () => {
      if (isClosed) return;
      isClosed = true;
      flush();
      pullTiming.close();
      diagnostics.close();
    },
  };
};
