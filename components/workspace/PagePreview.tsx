'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Check, ChevronLeft, ChevronRight, Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n';
import { useWorkspace } from '@/lib/store/workspace';
import { usePagePreview } from '@/lib/use-page-preview';
import { usePreviewPage } from '@/lib/use-preview-page';
import { useThumb } from '@/lib/use-thumb';

const ZOOMS = [1, 1.5, 2, 3];
const PADDING = 24;

const isTextField = (el: EventTarget | null) =>
  el instanceof HTMLElement &&
  (el.isContentEditable ||
    el instanceof HTMLTextAreaElement ||
    (el instanceof HTMLInputElement && !['checkbox', 'radio', 'button'].includes(el.type)));

export function PagePreview() {
  const t = useT();
  const { doc, index, page } = usePreviewPage();
  const selected = useWorkspace((s) => (page ? s.selectedPageIds.includes(page.id) : false));
  const togglePage = useWorkspace((s) => s.togglePage);
  const [zoom, setZoom] = useState(1);
  const [boxWidth, setBoxWidth] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const update = () => setBoxWidth(Math.max(0, el.offsetWidth - PADDING));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const dpr = typeof window === 'undefined' ? 1 : Math.min(2, window.devicePixelRatio || 1);
  const target = boxWidth > 0 ? Math.min(3200, Math.max(512, Math.ceil((boxWidth * zoom * dpr) / 256) * 256)) : 0;
  const rotation = page?.rotation ?? 0;
  const swap = rotation === 90 || rotation === 270;

  const { preview, failed } = usePagePreview(page?.srcId ?? null, page?.index ?? 0, swap, page ? target : 0);
  const thumb = useThumb(page?.srcId ?? '', page?.index ?? 0, page !== null);

  const total = doc?.pages.length ?? 0;
  const go = useCallback(
    (to: number) => {
      const next = doc?.pages[to];
      if (next) useWorkspace.setState({ anchorPageId: next.id });
    },
    [doc],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTextField(e.target) || index < 0) return;
      if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault();
        go(index - 1);
      } else if (e.key === 'ArrowRight' && index < total - 1) {
        e.preventDefault();
        go(index + 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, index, total]);

  const shown = preview ?? thumb;
  const base = shown ?? { w: 595, h: 842 };
  const effW = swap ? base.h : base.w;
  const effH = swap ? base.w : base.h;
  const zoomIdx = ZOOMS.indexOf(zoom);

  const stageStyle: CSSProperties = { width: `${zoom * 100}%`, aspectRatio: `${effW} / ${effH}` };
  const imgStyle: CSSProperties = {
    width: swap ? `${(effH / effW) * 100}%` : '100%',
    height: 'auto',
    transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
    transition: 'transform 0.25s ease',
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-2 border-b border-line px-3 py-2.5">
        <div className="flex items-center gap-2">
          <h2 className="min-w-0 flex-1 truncate text-sm font-semibold tabular-nums">
            {page ? t('preview.page', { n: index + 1, total }) : t('preview.title')}
          </h2>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            title={t('preview.prev')}
            aria-label={t('preview.prev')}
            disabled={index <= 0}
            onClick={() => go(index - 1)}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            title={t('preview.next')}
            aria-label={t('preview.next')}
            disabled={index < 0 || index >= total - 1}
            onClick={() => go(index + 1)}
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={selected ? 'accent' : 'outline'}
            aria-pressed={selected}
            disabled={!page}
            onClick={() => page && togglePage(page.id)}
          >
            <Check className="h-4 w-4" aria-hidden />
            {selected ? t('preview.deselect') : t('preview.select')}
          </Button>
          <div className="ml-auto flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              title={t('preview.zoomOut')}
              aria-label={t('preview.zoomOut')}
              disabled={zoomIdx <= 0}
              onClick={() => setZoom(ZOOMS[Math.max(0, zoomIdx - 1)])}
            >
              <ZoomOut className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="w-12 px-0 text-xs tabular-nums"
              title={t('preview.zoomReset')}
              aria-label={t('preview.zoomReset')}
              onClick={() => setZoom(1)}
            >
              {Math.round(zoom * 100)}%
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              title={t('preview.zoomIn')}
              aria-label={t('preview.zoomIn')}
              disabled={zoomIdx >= ZOOMS.length - 1}
              onClick={() => setZoom(ZOOMS[Math.min(ZOOMS.length - 1, zoomIdx + 1)])}
            >
              <ZoomIn className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      </div>

      <div ref={boxRef} className="mat-grid min-h-0 flex-1 overflow-auto p-3">
        {page ? (
          <div
            className="relative mx-auto bg-paper shadow-sheet"
            style={stageStyle}
            onDoubleClick={() => setZoom((z) => (z === 1 ? 2 : 1))}
          >
            {shown ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shown.url}
                alt={t('pages.number', { n: index + 1 })}
                draggable={false}
                className="absolute left-1/2 top-1/2 max-w-none select-none"
                style={imgStyle}
              />
            ) : (
              <div className="absolute inset-0 animate-pulse bg-line/50" />
            )}
            {!preview && !failed && (
              <span role="status" aria-label={t('preview.loading')} className="absolute right-2 top-2 rounded-full bg-navy/70 p-1.5 text-white">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              </span>
            )}
            {!preview && failed && (
              <p role="alert" className="absolute inset-x-2 top-2 rounded bg-sun px-2 py-1 text-center text-xs font-medium text-navy">
                {t('preview.error')}
              </p>
            )}
          </div>
        ) : (
          <p className="p-4 text-center text-sm text-subtle">{t('preview.empty')}</p>
        )}
      </div>
    </div>
  );
}
