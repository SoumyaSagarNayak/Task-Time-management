'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  

  useEffect(() => {
    console.log('isLoaded:', isLoaded, 'user:', user);
    if (!isLoaded) return;

    if (!user) {
      console.log('Redirecting to /sign-in');
      router.push('/sign-in');
      return;
    }

    console.log('Redirecting to /dashboard');
    router.push('/dashboard');
  }, [isLoaded, user, router]);

  if (!isLoaded) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return <div className="flex min-h-screen items-center justify-center">Redirecting...</div>;
}