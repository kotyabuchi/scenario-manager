import { describe, expect, it } from 'vitest';

import {
  PlaywrightSelectionRepresentationError,
  playwrightTestListLine,
} from './playwrightTestList';

const entry = { project: 'PC', file: 'specs/a.spec.ts', titlePath: ['確認'] };

describe('Playwright test-listの表現境界', () => {
  it.each([
    { project: '[PC]' },
    { file: 'specs/a›b.spec.ts' },
    { titlePath: ['前 › 後'] },
    { titlePath: ['行\n分割'] },
    { titlePath: [' 前後空白 '] },
  ])('登録の表記だけが絞り込み不能であることを区別する %o', (fields) => {
    expect(() =>
      playwrightTestListLine('specs', { ...entry, ...fields }),
    ).toThrow(PlaywrightSelectionRepresentationError);
  });

  it('不正なrepo相対pathは全件フォールバック対象にしない', () => {
    const invalid = () =>
      playwrightTestListLine('specs', { ...entry, file: '../outside.spec.ts' });
    expect(invalid).toThrow('pathが不正');
    expect(invalid).not.toThrow(PlaywrightSelectionRepresentationError);
  });
});
