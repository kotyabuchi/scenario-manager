import { devices } from '@playwright/test';

// 既存suiteとisolated suiteで同じ端末条件を使う。
export const DESKTOP_DEVICE = devices['Desktop Chrome'];
export const MOBILE_DEVICE = devices['Pixel 7'];
