'use client';

import { useMemo } from 'react';
import type { DocModel, PageRef } from '@/lib/pdf/types';
import { useWorkspace } from '@/lib/store/workspace';

// The previewed page is the last clicked one, else the first selected one, else page 1.
export function usePreviewPage(): { doc: DocModel | null; index: number; page: PageRef | null } {
  const doc = useWorkspace((s) => s.documents.find((d) => d.id === s.activeDocId) ?? null);
  const anchor = useWorkspace((s) => s.anchorPageId);
  const selected = useWorkspace((s) => s.selectedPageIds);

  return useMemo(() => {
    if (!doc || doc.pages.length === 0) return { doc, index: -1, page: null };
    let index = anchor ? doc.pages.findIndex((p) => p.id === anchor) : -1;
    if (index < 0 && selected.length > 0) {
      const chosen = new Set(selected);
      index = doc.pages.findIndex((p) => chosen.has(p.id));
    }
    if (index < 0) index = 0;
    return { doc, index, page: doc.pages[index] };
  }, [doc, anchor, selected]);
}
