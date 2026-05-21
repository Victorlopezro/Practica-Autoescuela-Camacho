'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentBookingsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/student/calendar');
  }, [router]);

  return null;
}
