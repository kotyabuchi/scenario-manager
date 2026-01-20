import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export const updateSession = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({
            request,
          });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // セッション更新（重要：必ず呼び出す）
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ルート分類
  const isLoginRoute = request.nextUrl.pathname.startsWith('/login');
  const isSignupRoute = request.nextUrl.pathname.startsWith('/signup');
  const isAuthCallbackRoute =
    request.nextUrl.pathname.startsWith('/auth/callback');

  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/home') ||
    request.nextUrl.pathname.startsWith('/sessions') ||
    request.nextUrl.pathname.startsWith('/profile');

  // 未ログインで保護ルートにアクセス → ログインへ
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 未ログインで /signup にアクセス → ログインへ
  if (!user && isSignupRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // ログイン済みで /login にアクセス → ホームへ
  // （/signup はユーザー登録が必要なので除外）
  if (user && isLoginRoute && !isAuthCallbackRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/home';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
};
