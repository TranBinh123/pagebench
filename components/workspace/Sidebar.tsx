'use client';

import { useDndContext } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FileText, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n';
import type { DocModel } from '@/lib/pdf/types';
import { useWorkspace } from '@/lib/store/workspace';

interface ItemProps {
  doc: DocModel;
  active: boolean;
  checked: boolean;
  onOpen: () => void;
}

function DocItem({ doc, active, checked, onOpen }: ItemProps) {
  const t = useT();
  const setActiveDoc = useWorkspace((s) => s.setActiveDoc);
  const toggleDocSelected = useWorkspace((s) => s.toggleDocSelected);
  const removeDoc = useWorkspace((s) => s.removeDoc);
  const { active: dragging } = useDndContext();
  const pageDrag = dragging?.data.current?.type === 'page';

  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({
    id: `doc:${doc.id}`,
    data: { type: 'doc', docId: doc.id },
  });

  const open = () => {
    setActiveDoc(doc.id);
    onOpen();
  };

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={open}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          open();
        }
      }}
      className={cn(
        'flex cursor-grab touch-manipulation items-center gap-2 rounded-md border px-2 py-2 active:cursor-grabbing',
        active ? 'border-ink/50 bg-mat' : 'border-transparent hover:bg-mat',
        isOver && pageDrag && 'border-cyan bg-cyan/10',
        isDragging && 'opacity-40',
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={() => toggleDocSelected(doc.id)}
        onClick={(e) => e.stopPropagation()}
        aria-label={t('sidebar.select', { name: doc.name })}
        className="h-4 w-4 shrink-0 cursor-pointer accent-magenta"
      />
      <FileText className="h-4 w-4 shrink-0 text-subtle" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" title={doc.name}>
          {doc.name}
        </p>
        <p className="text-xs tabular-nums text-subtle">{t('sidebar.pages', { n: doc.pages.length })}</p>
      </div>
      <button
        type="button"
        title={t('sidebar.remove')}
        aria-label={t('sidebar.remove')}
        onClick={(e) => {
          e.stopPropagation();
          removeDoc(doc.id);
        }}
        className="rounded p-1 text-subtle hover:bg-magenta/10 hover:text-magenta"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

export function Sidebar({ onAdd, onOpen }: { onAdd: () => void; onOpen: () => void }) {
  const t = useT();
  const documents = useWorkspace((s) => s.documents);
  const activeDocId = useWorkspace((s) => s.activeDocId);
  const selectedDocIds = useWorkspace((s) => s.selectedDocIds);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <h2 className="text-sm font-semibold">
          {t('sidebar.title')} <span className="font-normal tabular-nums text-subtle">{documents.length}</span>
        </h2>
        <Button size="sm" onClick={onAdd}>
          <Plus className="h-4 w-4" aria-hidden />
          {t('sidebar.add')}
        </Button>
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-2">
        <SortableContext items={documents.map((d) => `doc:${d.id}`)} strategy={verticalListSortingStrategy}>
          {documents.map((doc) => (
            <DocItem
              key={doc.id}
              doc={doc}
              active={doc.id === activeDocId}
              checked={selectedDocIds.includes(doc.id)}
              onOpen={onOpen}
            />
          ))}
        </SortableContext>
      </div>
      <p className="border-t border-line px-3 py-2 text-xs text-subtle">{t('sidebar.hint')}</p>
    </div>
  );
}
