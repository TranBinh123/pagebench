'use client';

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { FileText } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { peekThumb } from '@/lib/pdf/render';
import { useWorkspace } from '@/lib/store/workspace';

type DragData = { type: 'page'; pageId: string } | { type: 'doc'; docId: string };

const collision: CollisionDetection = (args) => {
  const type = (args.active.data.current as DragData | undefined)?.type;
  const containers =
    type === 'doc' ? args.droppableContainers.filter((c) => (c.data.current as DragData | undefined)?.type === 'doc') : args.droppableContainers;
  const hits = pointerWithin({ ...args, droppableContainers: containers });
  if (hits.length) return hits;
  return closestCenter({
    ...args,
    droppableContainers: containers.filter((c) => (c.data.current as DragData | undefined)?.type === type),
  });
};

export function DndLayer({ children }: { children: React.ReactNode }) {
  const t = useT();
  const [dragged, setDragged] = useState<DragData | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
  );

  const movingIds = (pageId: string) => {
    const selected = useWorkspace.getState().selectedPageIds;
    return selected.includes(pageId) ? selected : [pageId];
  };

  const onDragStart = (e: DragStartEvent) => setDragged((e.active.data.current as DragData) ?? null);

  const onDragEnd = (e: DragEndEvent) => {
    setDragged(null);
    const a = e.active.data.current as DragData | undefined;
    const o = e.over?.data.current as DragData | undefined;
    if (!a || !o) return;
    const ws = useWorkspace.getState();
    if (a.type === 'doc' && o.type === 'doc') {
      ws.reorderDocs(a.docId, o.docId);
    } else if (a.type === 'page' && o.type === 'page' && a.pageId !== o.pageId) {
      ws.reorderPages(movingIds(a.pageId), a.pageId, o.pageId);
    } else if (a.type === 'page' && o.type === 'doc') {
      ws.movePagesToDoc(movingIds(a.pageId), o.docId);
    }
  };

  const overlay = () => {
    if (!dragged) return null;
    const ws = useWorkspace.getState();
    if (dragged.type === 'doc') {
      const doc = ws.documents.find((d) => d.id === dragged.docId);
      return (
        <div className="flex items-center gap-2 rounded-md border border-brand bg-paper px-3 py-2 text-sm font-medium shadow-lg">
          <FileText className="h-4 w-4 text-subtle" aria-hidden />
          {doc?.name}
        </div>
      );
    }
    const page = ws.documents.flatMap((d) => d.pages).find((p) => p.id === dragged.pageId);
    const count = movingIds(dragged.pageId).length;
    const thumb = page ? peekThumb(page.srcId, page.index) : null;
    return (
      <div className="relative w-24 bg-paper shadow-sheet">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb.url} alt="" draggable={false} className="block w-full" style={{ transform: `rotate(${page?.rotation ?? 0}deg)` }} />
        ) : (
          <div className="aspect-[3/4] bg-line/60" />
        )}
        {count > 1 && (
          <span className="absolute -right-2 -top-2 rounded-full bg-sun px-2 py-0.5 text-xs font-semibold text-navy">
            {t('pages.dragCount', { n: count })}
          </span>
        )}
      </div>
    );
  };

  return (
    <DndContext sensors={sensors} collisionDetection={collision} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragged(null)}>
      {children}
      <DragOverlay dropAnimation={null}>{overlay()}</DragOverlay>
    </DndContext>
  );
}
