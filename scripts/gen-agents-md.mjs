#!/usr/bin/env node

/**
 * AGENTS.md 生成器
 *
 * Codex 用の `AGENTS.md` を、以下を結合して生成する:
 *   1. .claude/harness/agents-preamble.md（プロジェクト概要・規約以外の文脈）
 *   2. .claude/rules/<whitelist> の各ルールファイルの【全文】
 *
 * 既存の AGENTS.md はルールの「目次」だけでCodexにはIDのポインタしか届かなかったため、
 * ルール本文を丸ごと埋め込んで「完全ミラー」にする。ルールを更新したら再生成すること。
 *
 * 使い方:
 *   node scripts/gen-agents-md.mjs          … AGENTS.md を生成/更新
 *   node scripts/gen-agents-md.mjs --check  … 生成結果と既存を比較し、差分があれば exit 1
 *                                             （lefthook / CI でドリフト検出に使う）
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');

const PREAMBLE = '.claude/harness/agents-preamble.md';

// Codex に配布する「コードがどうあるべきか」の規約。
// Claude 運用系（plan-mode / agent-strategy / tdd-workflow）と
// Claude ツール固有（bash-rules）は Codex には無関係なため意図的に除外する。
const RULES = [
  'coding-standards.md',
  'typescript-rules.md',
  'react-rules.md',
  'styling-rules.md',
  'form-rules.md',
  'error-handling.md',
  'logging.md',
  'icons.md',
  'accessibility.md',
  'testing-patterns.md',
  'terminology.md',
];

const AUTOGEN_HEADER = `<!--
  ⚠️ このファイルは自動生成です。直接編集しないこと。
  生成元: ${PREAMBLE} + .claude/rules/<whitelist>
  再生成: pnpm gen:agents （scripts/gen-agents-md.mjs）
  規約を変えるときは .claude/rules/*.md または上記プリアンブルを編集し、再生成すること。
  同期は lefthook pre-commit が自動で行う（--check でドリフト検出）。
-->`;

/** CRLF を LF に正規化して読み込む（生成物の改行を環境非依存にする） */
function read(relPath) {
  return readFileSync(join(repoRoot, relPath), 'utf8').replace(/\r\n/g, '\n');
}

function build() {
  const sections = [];
  sections.push(AUTOGEN_HEADER);
  sections.push(read(PREAMBLE).trim());
  sections.push('---');
  sections.push(
    '# コーディング規約（全文ミラー）\n\n' +
      '> 以下は `.claude/rules/` の各ルールファイルの全文。Codex はこの内容を必ず遵守すること。\n' +
      '> 出典は各セクション冒頭の `source:` コメントを参照。',
  );
  for (const name of RULES) {
    const content = read(join('.claude/rules', name)).trim();
    sections.push(`<!-- source: .claude/rules/${name} -->\n\n${content}`);
  }
  return `${sections.join('\n\n')}\n`;
}

const output = build();
const target = join(repoRoot, 'AGENTS.md');
const isCheck = process.argv.includes('--check');

if (isCheck) {
  let current = '';
  try {
    current = readFileSync(target, 'utf8').replace(/\r\n/g, '\n');
  } catch {
    // AGENTS.md が無い場合は未同期扱い
  }
  if (current !== output) {
    console.error(
      'AGENTS.md が最新の規約と同期していません。`pnpm gen:agents` を実行して結果をコミットしてください。',
    );
    process.exit(1);
  }
  console.log('AGENTS.md は同期済みです。');
} else {
  writeFileSync(target, output, 'utf8');
  console.log(
    `AGENTS.md を生成しました（プリアンブル + ${RULES.length} ルールの全文ミラー）。`,
  );
}
