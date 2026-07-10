'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect immediately to login page with a query parameter warning
    const warningMsg = encodeURIComponent('Os cadastros públicos estão suspensos. Entre em contato com o suporte ou utilize o convite secreto.');
    router.replace(`/login?msg=${warningMsg}`);
  }, [router]);

  return null;
}
