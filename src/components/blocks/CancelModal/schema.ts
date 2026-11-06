import { z } from 'zod';

export const cancelReasonSchema = z.object({
  reason: z.string().max(500, '理由は500文字以内で入力してください'),
});

export type CancelReasonValues = z.infer<typeof cancelReasonSchema>;
