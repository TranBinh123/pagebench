import { create } from 'zustand';
import { arrayMove } from '@dnd-kit/sortable';
import type { MessageKey } from '@/lib/i18n';
import type { DocModel, PageRef } from '@/lib/pdf/types';
import { loadDocument, PdfLoadError } from '@/lib/pdf/load';
import { mergeDocs } from '@/lib/pdf/merge';
import { splitEachPage, splitPages } from '@/lib/pdf/split';
import { deletePages } from '@/lib/pdf/delete';
import { rotatePages } from '@/lib/pdf/rotate';
import { baseName, uid } from '@/lib/pdf/utils';

const HISTORY_LIMIT = 50;

type Params = Record<string, string | number>;

interface Snapshot {
  documents: DocModel[];
  activeDocId: string | null;
}

export interface Notice {
  id: string;
  key: MessageKey;
  params?: Params;
}

export interface Busy {
  key: MessageKey;
  params?: Params;
  progress: number | null;
}

interface WorkspaceState {
  documents: DocModel[];
  activeDocId: string | null;
  selectedDocIds: string[];
  selectedPageIds: string[];
  anchorPageId: string | null;
  past: Snapshot[];
  future: Snapshot[];
  busy: Busy | null;
  notices: Notice[];

  addFiles: (files: File[]) => Promise<void>;
  setActiveDoc: (id: string) => void;
  toggleDocSelected: (id: string) => void;
  removeDoc: (id: string) => void;
  togglePage: (id: string, range?: boolean) => void;
  setSelectedPages: (ids: string[]) => void;
  selectAllPages: () => void;
  clearPageSelection: () => void;
  reorderDocs: (activeId: string, overId: string) => void;
  reorderPages: (ids: string[], activeId: string, overId: string) => void;
  movePagesToDoc: (ids: string[], targetDocId: string) => void;
  mergeSelected: () => void;
  mergeAll: () => void;
  splitSelection: (removeOriginal: boolean) => void;
  splitEach: (removeOriginal: boolean) => void;
  deleteSelectedPages: () => void;
  rotate: (delta: number) => void;
  undo: () => void;
  redo: () => void;
  setBusy: (busy: Busy | null) => void;
  pushNotice: (key: MessageKey, params?: Params) => void;
  dismissNotice: (id: string) => void;
}

export const useWorkspace = create<WorkspaceState>((set, get) => {
  // Records a history entry and applies a new document list.
  const commit = (documents: DocModel[], activeDocId: string | null, keepPages = false) => {
    const s = get();
    const alive = new Set(documents.map((d) => d.id));
    const active = activeDocId && alive.has(activeDocId) ? activeDocId : documents[0]?.id ?? null;
    const pageIds = new Set(documents.find((d) => d.id === active)?.pages.map((p) => p.id));
    set({
      documents,
      activeDocId: active,
      selectedDocIds: s.selectedDocIds.filter((id) => alive.has(id)),
      selectedPageIds: keepPages ? s.selectedPageIds.filter((id) => pageIds.has(id)) : [],
      anchorPageId: keepPages ? s.anchorPageId : null,
      past: [...s.past, { documents: s.documents, activeDocId: s.activeDocId }].slice(-HISTORY_LIMIT),
      future: [],
    });
  };

  const activeDoc = () => {
    const s = get();
    return s.documents.find((d) => d.id === s.activeDocId) ?? null;
  };

  const pageSelection = (doc: DocModel) => {
    const chosen = new Set(get().selectedPageIds);
    return new Set(doc.pages.filter((p) => chosen.has(p.id)).map((p) => p.id));
  };

  const insertAfter = (docId: string, created: DocModel[], removeOriginal: boolean) => {
    const docs = [...get().documents];
    const at = docs.findIndex((d) => d.id === docId);
    docs.splice(at + 1, 0, ...created);
    commit(removeOriginal ? docs.filter((d) => d.id !== docId) : docs, created[0].id);
  };

  const restore = (snap: Snapshot) => {
    const alive = new Set(snap.documents.map((d) => d.id));
    return {
      documents: snap.documents,
      activeDocId: snap.activeDocId && alive.has(snap.activeDocId) ? snap.activeDocId : snap.documents[0]?.id ?? null,
      selectedDocIds: get().selectedDocIds.filter((id) => alive.has(id)),
      selectedPageIds: [],
      anchorPageId: null,
    };
  };

  return {
    documents: [],
    activeDocId: null,
    selectedDocIds: [],
    selectedPageIds: [],
    anchorPageId: null,
    past: [],
    future: [],
    busy: null,
    notices: [],

    addFiles: async (files) => {
      const added: DocModel[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        set({
          busy: { key: 'progress.loading', params: { name: file.name }, progress: files.length > 1 ? i / files.length : null },
        });
        try {
          added.push(await loadDocument(file));
        } catch (error) {
          const code = error instanceof PdfLoadError ? error.code : 'corrupt';
          get().pushNotice(
            code === 'notPdf' ? 'error.notPdf' : code === 'encrypted' ? 'error.encrypted' : 'error.corrupt',
            { name: file.name },
          );
        }
      }
      set({ busy: null });
      if (added.length) {
        const s = get();
        commit([...s.documents, ...added], s.activeDocId ?? added[0].id, true);
      }
    },

    setActiveDoc: (id) => set({ activeDocId: id, selectedPageIds: [], anchorPageId: null }),

    toggleDocSelected: (id) =>
      set((s) => ({
        selectedDocIds: s.selectedDocIds.includes(id) ? s.selectedDocIds.filter((x) => x !== id) : [...s.selectedDocIds, id],
      })),

    removeDoc: (id) => {
      const s = get();
      commit(s.documents.filter((d) => d.id !== id), s.activeDocId);
    },

    togglePage: (id, range = false) => {
      const { selectedPageIds, anchorPageId } = get();
      const doc = activeDoc();
      if (!doc) return;
      if (range && anchorPageId) {
        const a = doc.pages.findIndex((p) => p.id === anchorPageId);
        const b = doc.pages.findIndex((p) => p.id === id);
        if (a >= 0 && b >= 0) {
          const ids = doc.pages.slice(Math.min(a, b), Math.max(a, b) + 1).map((p) => p.id);
          set({ selectedPageIds: Array.from(new Set([...selectedPageIds, ...ids])) });
          return;
        }
      }
      set({
        selectedPageIds: selectedPageIds.includes(id) ? selectedPageIds.filter((x) => x !== id) : [...selectedPageIds, id],
        anchorPageId: id,
      });
    },

    setSelectedPages: (ids) => set({ selectedPageIds: ids, anchorPageId: ids[ids.length - 1] ?? null }),

    selectAllPages: () => {
      const doc = activeDoc();
      if (doc) set({ selectedPageIds: doc.pages.map((p) => p.id) });
    },

    clearPageSelection: () => set({ selectedPageIds: [], anchorPageId: null }),

    reorderDocs: (activeId, overId) => {
      const s = get();
      const from = s.documents.findIndex((d) => d.id === activeId);
      const to = s.documents.findIndex((d) => d.id === overId);
      if (from < 0 || to < 0 || from === to) return;
      commit(arrayMove(s.documents, from, to), s.activeDocId, true);
    },

    reorderPages: (ids, activeId, overId) => {
      const doc = activeDoc();
      if (!doc) return;
      const moving = new Set(ids);
      if (moving.has(overId)) return;
      const from = doc.pages.findIndex((p) => p.id === activeId);
      const over = doc.pages.findIndex((p) => p.id === overId);
      if (from < 0 || over < 0) return;
      const block = doc.pages.filter((p) => moving.has(p.id));
      const rest = doc.pages.filter((p) => !moving.has(p.id));
      const overInRest = rest.findIndex((p) => p.id === overId);
      rest.splice(from < over ? overInRest + 1 : overInRest, 0, ...block);
      commit(get().documents.map((d) => (d.id === doc.id ? { ...doc, pages: rest } : d)), doc.id, true);
    },

    movePagesToDoc: (ids, targetDocId) => {
      const s = get();
      if (!s.documents.some((d) => d.id === targetDocId)) return;
      const chosen = new Set(ids);
      const moved: PageRef[] = [];
      const stripped = s.documents.map((d) => {
        if (d.id === targetDocId) return d;
        const keep = d.pages.filter((p) => {
          if (!chosen.has(p.id)) return true;
          moved.push(p);
          return false;
        });
        return keep.length === d.pages.length ? d : { ...d, pages: keep };
      });
      if (!moved.length) return;
      const docs = stripped
        .map((d) => (d.id === targetDocId ? { ...d, pages: [...d.pages, ...moved] } : d))
        .filter((d) => d.pages.length > 0);
      commit(docs, docs.some((d) => d.id === s.activeDocId) ? s.activeDocId : targetDocId);
    },

    mergeSelected: () => {
      const s = get();
      const chosen = s.documents.filter((d) => s.selectedDocIds.includes(d.id));
      if (chosen.length < 2) {
        s.pushNotice('error.needTwoDocs');
        return;
      }
      const merged = mergeDocs(chosen, `${baseName(chosen[0].name)}-merged.pdf`);
      const rest = s.documents.filter((d) => !chosen.includes(d));
      rest.splice(s.documents.findIndex((d) => d.id === chosen[0].id), 0, merged);
      commit(rest, merged.id);
    },

    mergeAll: () => {
      const s = get();
      if (s.documents.length < 2) {
        s.pushNotice('error.needTwoDocs');
        return;
      }
      const merged = mergeDocs(s.documents, `${baseName(s.documents[0].name)}-merged.pdf`);
      commit([merged], merged.id);
    },

    splitSelection: (removeOriginal) => {
      const doc = activeDoc();
      if (!doc) return;
      const chosen = pageSelection(doc);
      if (!chosen.size) {
        get().pushNotice('error.selectPages');
        return;
      }
      const indices = doc.pages.flatMap((p, i) => (chosen.has(p.id) ? [i] : []));
      insertAfter(doc.id, [splitPages(doc, indices)], removeOriginal);
    },

    splitEach: (removeOriginal) => {
      const doc = activeDoc();
      if (doc) insertAfter(doc.id, splitEachPage(doc), removeOriginal);
    },

    deleteSelectedPages: () => {
      const doc = activeDoc();
      if (!doc) return;
      const chosen = pageSelection(doc);
      if (!chosen.size) {
        get().pushNotice('error.selectPages');
        return;
      }
      const next = deletePages(doc, chosen);
      if (!next) {
        get().pushNotice('error.deleteAll');
        return;
      }
      commit(get().documents.map((d) => (d.id === doc.id ? next : d)), doc.id);
    },

    rotate: (delta) => {
      const doc = activeDoc();
      if (!doc) return;
      const chosen = pageSelection(doc);
      const next = rotatePages(doc, chosen.size ? chosen : null, delta);
      commit(get().documents.map((d) => (d.id === doc.id ? next : d)), doc.id, true);
    },

    undo: () => {
      const s = get();
      const prev = s.past[s.past.length - 1];
      if (!prev) return;
      set({
        ...restore(prev),
        past: s.past.slice(0, -1),
        future: [{ documents: s.documents, activeDocId: s.activeDocId }, ...s.future].slice(0, HISTORY_LIMIT),
      });
    },

    redo: () => {
      const s = get();
      const next = s.future[0];
      if (!next) return;
      set({
        ...restore(next),
        past: [...s.past, { documents: s.documents, activeDocId: s.activeDocId }].slice(-HISTORY_LIMIT),
        future: s.future.slice(1),
      });
    },

    setBusy: (busy) => set({ busy }),

    pushNotice: (key, params) => {
      const id = uid();
      set((s) => ({ notices: [...s.notices.slice(-3), { id, key, params }] }));
      setTimeout(() => get().dismissNotice(id), 7000);
    },

    dismissNotice: (id) => set((s) => ({ notices: s.notices.filter((n) => n.id !== id) })),
  };
});
