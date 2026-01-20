import type { InferSelectModel } from 'drizzle-orm';
import type { users } from '@/db/schema';

// Drizzleスキーマから型を導出
type User = InferSelectModel<typeof users>;

// ページProps
type UserProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export type { User, UserProfilePageProps };
