import { describe, expect, it } from 'vitest';

import { readBoundedDiagnosticChild } from './boundedDiagnosticChild';

describe('所有childの実中断', () => {
  it('pipeが開いた実childを中断し、実close後にのみ返る', async () => {
    const controller = new AbortController();
    const { child, completion } = readBoundedDiagnosticChild(
      process.execPath,
      ['-e', "process.stdout.write('ready');setInterval(() => {}, 1000)"],
      controller.signal,
    );
    if (!child || !child.stdout) throw new Error('fixture childの起動失敗');
    await new Promise<void>((resolve, reject) => {
      child.stdout?.once('data', () => resolve());
      child.once('error', reject);
    });
    let closed = false;
    child.once('close', () => {
      closed = true;
    });
    controller.abort();
    expect(await completion).toBeNull();
    expect(closed).toBe(true);
    expect(child.exitCode !== null || child.signalCode !== null).toBe(true);
  }, 10_000);
});
