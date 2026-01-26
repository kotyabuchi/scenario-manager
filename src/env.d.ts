declare namespace NodeJS {
  interface ProcessEnv {
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;

    // Database (Drizzle)
    DATABASE_URL: string;
    DATABASE_DIRECT_URL: string;

    // Node environment
    NODE_ENV: 'development' | 'production' | 'test';
  }
}
