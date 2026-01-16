import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

config({ path: '.env.local' });

// biome-ignore lint/complexity/useLiteralKeys: Typescriptの型推論が効かないため
const client = postgres(process.env['DATABASE_URL'] ?? '');
export const db = drizzle({ client, schema });
