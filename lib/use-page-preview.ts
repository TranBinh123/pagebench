'use client';

import { useEffect, useState } from 'react';
import { peekPreview, previewKey, renderPreview, type Preview } from '@/lib/pdf/render';

interface Shown {
  pageKey: string;
  preview: Preview;
}

// Keeps the previous resolution of the same page on screen while a sharper one renders.
export function usePagePreview(
  srcId: string | null,
  index: number,
  swap: boolean,
  targetWidth: number,
): { preview: Preview | null; failed: boolean } {
  const [shown, setShown] = useState<Shown | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const pageKey = srcId ? `${srcId}:${index}` : '';

  useEffect(() => {
    if (!srcId || targetWidth <= 0) return;
    setFailedKey((k) => (k === pageKey ? null : k));

    const cached = peekPreview(previewKey(srcId, index, swap, targetWidth));
    if (cached) {
      setShown({ pageKey, preview: cached });
      return;
    }

    const ctrl = new AbortController();
    renderPreview(srcId, index, swap, targetWidth, ctrl.signal)
      .then((preview) => {
        if (!ctrl.signal.aborted) setShown({ pageKey, preview });
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setFailedKey(pageKey);
      });
    return () => ctrl.abort();
  }, [srcId, index, swap, targetWidth, pageKey]);

  return {
    preview: shown && shown.pageKey === pageKey ? shown.preview : null,
    failed: failedKey === pageKey,
  };
}
