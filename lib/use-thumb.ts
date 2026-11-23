'use client';

import { useEffect, useState } from 'react';
import { getThumb, peekThumb, type Thumb } from '@/lib/pdf/render';

export function useThumb(srcId: string, index: number, visible: boolean): Thumb | null {
  const [thumb, setThumb] = useState<Thumb | null>(() => peekThumb(srcId, index));

  useEffect(() => {
    const cached = peekThumb(srcId, index);
    if (cached) {
      setThumb(cached);
      return;
    }
    if (!visible) return;
    let alive = true;
    getThumb(srcId, index)
      .then((t) => alive && setThumb(t))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [srcId, index, visible]);

  return thumb;
}
