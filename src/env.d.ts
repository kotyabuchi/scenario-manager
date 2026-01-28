declare namespace NodeJS {
  interface ProcessEnv {
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;

    // Database (Supabase — REST API経由でアクセス、直接接続不要)

    // Cloudflare R2
    R2_PUBLIC_URL?: string;

    // Node environment
    NODE_ENV: 'development' | 'production' | 'test';
  }
}
