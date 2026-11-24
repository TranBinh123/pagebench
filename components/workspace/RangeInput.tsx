'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '@/lib/i18n';
import { formatRange, parseRange } from '@/lib/pdf/utils';
import { useWorkspace } from '@/lib/store/workspace';

export function RangeInput() {
  const t = useT();
  const doc = useWorkspace((s) => s.documents.find((d) => d.id === s.activeDocId) ?? null);
  const selectedPageIds = useWorkspace((s) => s.selectedPageIds);
  const setSelectedPages = useWorkspace((s) => s.setSelectedPages);

  const selectedIdx = useMemo(() => {
    if (!doc) return [];
    const chosen = new Set(selectedPageIds);
    return doc.pages.flatMap((p, i) => (chosen.has(p.id) ? [i] : []));
  }, [doc, selectedPageIds]);
  const canonical = formatRange(selectedIdx);

  const [text, setText] = useState('');
  const [error, setError] = useState<'invalid' | 'outOfRange' | null>(null);
  const editing = useRef(false);

  useEffect(() => {
    if (!editing.current) {
      setText(canonical);
      setError(null);
    }
  }, [canonical, doc?.id]);

  const onChange = (value: string) => {
    setText(value);
    if (!doc) return;
    const result = parseRange(value, doc.pages.length);
    setError(result.error);
    if (!result.error) setSelectedPages(result.indices.map((i) => doc.pages[i].id));
  };

  const status = error
    ? error === 'invalid'
      ? t('range.invalid')
      : t('range.outOfRange', { max: doc?.pages.length ?? 0 })
    : selectedIdx.length
      ? t('range.selected', { n: selectedIdx.length, total: doc?.pages.length ?? 0 })
      : t('range.none');

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
      <label className="flex items-center gap-2 text-sm font-medium">
        {t('range.label')}
        <input
          value={text}
          disabled={!doc}
          placeholder={t('range.placeholder')}
          inputMode="numeric"
          enterKeyHint="done"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-invalid={error !== null}
          onFocus={() => {
            editing.current = true;
          }}
          onBlur={() => {
            editing.current = false;
            setText(canonical);
            setError(null);
          }}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-40 rounded-md border border-line bg-paper px-2.5 text-base tabular-nums sm:text-sm placeholder:text-subtle/70 focus:border-brand aria-[invalid=true]:border-sun aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-sun disabled:opacity-40"
        />
      </label>
      <span
        role="status"
        className={error ? 'rounded bg-sun px-1.5 py-0.5 text-sm font-medium text-navy' : 'text-sm text-subtle'}
      >
        {status}
      </span>
    </div>
  );
}
