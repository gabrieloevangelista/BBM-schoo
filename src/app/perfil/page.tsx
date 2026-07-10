'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PerfilSkeleton } from '@/components/SkeletonLoaders';

export default function ProfileRedirect() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace(`/perfil/${user.username}`);
      } else {
        router.replace('/login');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return <PerfilSkeleton />;
  }

  return null;
}
