import { Suspense } from 'react';

import { LoginContent, LoginFallback } from './_components';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}
