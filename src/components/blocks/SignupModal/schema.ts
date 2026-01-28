// TODO: TDD Green フェーズで実装する
// このファイルはテストを通すための最小限のスタブ
import { z } from 'zod';

export const signupFormSchema = z.object({});

export const signupStep2Schema = z.object({});

export type SignupFormValues = z.infer<typeof signupFormSchema>;
export type SignupStep2Values = z.infer<typeof signupStep2Schema>;
