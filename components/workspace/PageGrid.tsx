'use client';

import { useMemo } from 'react';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n';
import { useWorkspace } from '@/lib/store/workspace';
import { PageThumb } from './PageThumb';
import { RangeInput } from './RangeInput';

export function PageGrid() {
  const t = useT();
  const doc = useWorkspace((s) => s.documents.find((d) => d.id === s.activeDocId) ?? null);
  const selectedPageIds = useWorkspace((s) => s.selectedPageIds);
  const selectAllPages = useWorkspace((s) => s.selectAllPages);
  const clearPageSelection = useWorkspace((s) => s.clearPageSelection);
  const selected = useMemo(() => new Set(selectedPageIds), [selectedPageIds]);

  if (!doc) {
    return (
      <div className="mat-grid flex h-full items-center justify-center p-6 text-center text-sm text-subtle">
        {t('pages.empty')}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line bg-paper px-4 py-2.5">
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
          <h2 className="max-w-[16rem] truncate text-sm font-semibold" title={doc.name}>
            {doc.name}
          </h2>
          <RangeInput />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={selectAllPages}>
            {t('pages.selectAll')}
          </Button>
          <Button size="sm" variant="ghost" onClick={clearPageSelection} disabled={selectedPageIds.length === 0}>
            {t('pages.clear')}
          </Button>
        </div>
      </div>
      <div className="mat-grid min-h-0 flex-1 overflow-y-auto p-4">
        <SortableContext items={doc.pages.map((p) => `page:${p.id}`)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-3">
            {doc.pages.map((page, i) => (
              <PageThumb key={page.id} page={page} number={i + 1} selected={selected.has(page.id)} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
