'use client';

import { memo, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useT } from '@/lib/i18n';
import type { PageRef } from '@/lib/pdf/types';
import { cn } from '@/lib/cn';
import { useThumb } from '@/lib/use-thumb';
import { useWorkspace } from '@/lib/store/workspace';

interface Props {
  page: PageRef;
  number: number;
  selected: boolean;
}

export const PageThumb = memo(function PageThumb({ page, number, selected }: Props) {
  const t = useT();
  const togglePage = useWorkspace((s) => s.togglePage);
  const boxRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const thumb = useThumb(page.srcId, page.index, visible);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `page:${page.id}`,
    data: { type: 'page', pageId: page.id },
  });

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '400px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const base = thumb ?? { w: 595, h: 842 };
  const swap = page.rotation === 90 || page.rotation === 270;
  const effW = swap ? base.h : base.w;
  const effH = swap ? base.w : base.h;

  const stageStyle: CSSProperties = {
    aspectRatio: `${effW} / ${effH}`,
    maxWidth: '100%',
    maxHeight: '100%',
    ...(effW > effH ? { width: '100%' } : { height: '100%' }),
  };
  const imgStyle: CSSProperties = {
    width: swap ? `${(effH / effW) * 100}%` : '100%',
    height: 'auto',
    transform: `translate(-50%, -50%) rotate(${page.rotation}deg)`,
    transition: 'transform 0.25s ease',
  };

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      role="button"
      aria-pressed={selected}
      aria-label={t('pages.number', { n: number })}
      onClick={(e) => togglePage(page.id, e.shiftKey)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          togglePage(page.id, e.shiftKey);
        }
      }}
      className={cn(
        'flex cursor-grab touch-manipulation select-none flex-col items-center gap-2 rounded-sm p-2 active:cursor-grabbing',
        isDragging && 'opacity-30',
      )}
    >
      <div ref={boxRef} className="flex h-44 w-full items-center justify-center">
        <div className="relative bg-paper shadow-sheet" style={stageStyle}>
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb.url}
              alt=""
              draggable={false}
              className="absolute left-1/2 top-1/2 max-w-none"
              style={imgStyle}
            />
          ) : (
            <div className="absolute inset-0 animate-pulse bg-line/50" />
          )}
          {selected && <span className="crop-marks" aria-hidden />}
        </div>
      </div>
      <span className={cn('text-xs tabular-nums', selected ? 'font-semibold text-magenta' : 'text-subtle')}>{number}</span>
    </div>
  );
});
