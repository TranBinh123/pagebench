'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { DndLayer } from '@/components/workspace/DndLayer';
import { DropZone } from '@/components/workspace/DropZone';
import { BusyBar, Notices } from '@/components/workspace/Feedback';
import { PageGrid } from '@/components/workspace/PageGrid';
import { Sidebar } from '@/components/workspace/Sidebar';
import { Toolbar } from '@/components/workspace/Toolbar';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n';
import { useWorkspace } from '@/lib/store/workspace';

const isTextField = (el: EventTarget | null) =>
  el instanceof HTMLElement &&
  (el.isContentEditable ||
    el instanceof HTMLTextAreaElement ||
    (el instanceof HTMLInputElement && !['checkbox', 'radio', 'button'].includes(el.type)));

const hasFiles = (e: React.DragEvent) => Array.from(e.dataTransfer.types).includes('Files');

export default function Page() {
  const t = useT();
  const docCount = useWorkspace((s) => s.documents.length);
  const [tab, setTab] = useState<'docs' | 'pages'>('docs');
  const [fileDrag, setFileDrag] = useState(false);
  const depth = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const hadDocs = useRef(false);

  const openPicker = useCallback(() => inputRef.current?.click(), []);

  const addFiles = useCallback((files: File[]) => {
    if (files.length) void useWorkspace.getState().addFiles(files);
  }, []);

  useEffect(() => {
    if (docCount > 0 && !hadDocs.current) setTab('pages');
    hadDocs.current = docCount > 0;
  }, [docCount]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTextField(e.target)) return;
      const ws = useWorkspace.getState();
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (mod && key === 'z') {
        e.preventDefault();
        if (e.shiftKey) ws.redo();
        else ws.undo();
      } else if (mod && key === 'y') {
        e.preventDefault();
        ws.redo();
      } else if (mod && key === 'a') {
        e.preventDefault();
        ws.selectAllPages();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && ws.selectedPageIds.length > 0) {
        e.preventDefault();
        ws.deleteSelectedPages();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      className="flex h-dvh flex-col"
      onDragEnter={(e) => {
        if (!hasFiles(e)) return;
        depth.current++;
        setFileDrag(true);
      }}
      onDragLeave={(e) => {
        if (!hasFiles(e)) return;
        depth.current--;
        if (depth.current <= 0) setFileDrag(false);
      }}
      onDragOver={(e) => {
        if (hasFiles(e)) e.preventDefault();
      }}
      onDrop={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        depth.current = 0;
        setFileDrag(false);
        addFiles(Array.from(e.dataTransfer.files));
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = '';
          addFiles(files);
        }}
      />

      <DndLayer>
        <Toolbar />
        <BusyBar />
        {docCount === 0 ? (
          <DropZone onAdd={openPicker} />
        ) : (
          <>
            <div role="tablist" className="flex border-b border-line bg-paper md:hidden">
              {(['docs', 'pages'] as const).map((id) => (
                <button
                  key={id}
                  role="tab"
                  type="button"
                  aria-selected={tab === id}
                  onClick={() => setTab(id)}
                  className={cn(
                    'flex-1 border-b-2 py-2.5 text-sm font-medium',
                    tab === id ? 'border-brand bg-brand/10 text-ink' : 'border-transparent text-subtle',
                  )}
                >
                  {t(id === 'docs' ? 'tab.docs' : 'tab.pages')}
                </button>
              ))}
            </div>
            <div className="flex min-h-0 flex-1">
              <aside
                className={cn(
                  'w-full shrink-0 border-r border-line bg-paper md:block md:w-72',
                  tab === 'docs' ? 'block' : 'hidden',
                )}
              >
                <Sidebar onAdd={openPicker} onOpen={() => setTab('pages')} />
              </aside>
              <main className={cn('min-w-0 flex-1', tab === 'pages' ? 'block' : 'hidden md:block')}>
                <PageGrid />
              </main>
            </div>
          </>
        )}
      </DndLayer>

      {fileDrag && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-navy/60">
          <div className="flex items-center gap-3 rounded-lg border-2 border-dashed border-sun bg-paper px-8 py-6 text-lg font-semibold">
            <Upload className="h-6 w-6" aria-hidden />
            {t('drop.overlay')}
          </div>
        </div>
      )}
      <Notices />
    </div>
  );
}
