'use client';

import { useEffect } from 'react';
import { useSettings } from '@/lib/store/settings';

export function Providers({ children }: { children: React.ReactNode }) {
  const hydrate = useSettings((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  return <>{children}</>;
}
