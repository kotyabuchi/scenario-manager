#!/usr/bin/env node

/**
 * agent-browser.cmdを修正するスクリプト
 *
 * Windows環境では、agent-browserのnpmパッケージに含まれるagent-browser.cmdが
 * 存在しないdist/index.jsを呼び出そうとするため、ネイティブバイナリを
 * 直接呼び出すように修正する。
 *
 * 使用方法:
 *   node scripts/fix-agent-browser.js
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const isWindows = process.platform === 'win32';

if (!isWindows) {
  console.log('ℹ This script is only needed on Windows');
  process.exit(0);
}

// Windows環境でのagent-browser.cmdのパス
const cmdPath = join(
  process.env.APPDATA || join(homedir(), 'AppData', 'Roaming'),
  'npm',
  'node_modules',
  'agent-browser',
  'bin',
  'agent-browser.cmd',
);

if (!existsSync(cmdPath)) {
  console.error('✗ agent-browser.cmd not found');
  console.error('  Run: npm install -g agent-browser');
  process.exit(1);
}

// 修正内容
const fixedContent = `@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
"%SCRIPT_DIR%agent-browser-win32-x64.exe" %*
exit /b %errorlevel%
`;

try {
  // 現在の内容を確認
  const currentContent = readFileSync(cmdPath, 'utf8');

  if (currentContent.includes('agent-browser-win32-x64.exe')) {
    console.log('✓ agent-browser.cmd is already fixed');
    process.exit(0);
  }

  // 修正を適用
  writeFileSync(cmdPath, fixedContent, 'utf8');
  console.log('✓ agent-browser.cmd fixed successfully');
  console.log(`  Path: ${cmdPath}`);
} catch (error) {
  console.error('✗ Failed to fix agent-browser.cmd');
  console.error(`  Error: ${error.message}`);
  process.exit(1);
}
