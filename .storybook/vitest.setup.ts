import '@testing-library/jest-dom/vitest';
import * as a11yAddonAnnotations from '@storybook/addon-a11y/preview';
import { setProjectAnnotations } from '@storybook/react';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll } from 'vitest';

import * as projectAnnotations from './preview';

// テスト間でDOMをクリーンアップ
afterEach(() => {
  cleanup();
});

// composeStories使用時にStorybook設定を適用するために必要
// More info at: https://storybook.js.org/docs/api/portable-stories/portable-stories-vitest#setprojectannotations
const project = setProjectAnnotations([
  a11yAddonAnnotations,
  projectAnnotations,
]);

beforeAll(project.beforeAll);
