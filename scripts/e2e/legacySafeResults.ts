import { legacyExecutionResultSchema } from './legacyExecutionSchema';

/** 公開行の形だけを検査する。理由・由来・集合はtrusted executionとも照合する。 */
/**
 * 公開する結果行の形状を検査する。正本との集合・fingerprint・skip理由の照合は含まない。
 * 保存側は実結果を照合してから投影し、CI受信側でも別途正本と照合する。
 */
export const legacySafeResultsSchema = legacyExecutionResultSchema
  .superRefine((row, context) => {
    const annotation = row.annotations[0];
    const passed =
      row.status === 'passed' &&
      row.expectedStatus === 'passed' &&
      row.annotations.length === 0;
    const skipped =
      row.status === 'skipped' &&
      row.expectedStatus === 'skipped' &&
      row.annotations.length === 1 &&
      (annotation?.type === 'skip' || annotation?.type === 'fixme');
    if (!passed && !skipped)
      context.addIssue({
        code: 'custom',
        message: '公開legacy結果の状態またはannotationが不正です。',
      });
  })
  .array()
  .superRefine((rows, context) => {
    if (new Set(rows.map(({ key }) => key)).size !== rows.length)
      context.addIssue({
        code: 'custom',
        message: '公開legacy結果が重複しています。',
      });
  });
