'use client';

import { X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useT } from '@/lib/i18n';
import { useWorkspace } from '@/lib/store/workspace';

export function BusyBar() {
  const t = useT();
  const busy = useWorkspace((s) => s.busy);
  if (!busy) return null;
  return (
    <div role="status" className="border-b border-line bg-paper px-4 py-2">
      <p className="mb-1.5 truncate text-xs text-subtle">{t(busy.key, busy.params)}</p>
      <Progress value={busy.progress} />
    </div>
  );
}

export function Notices() {
  const t = useT();
  const notices = useWorkspace((s) => s.notices);
  const dismiss = useWorkspace((s) => s.dismissNotice);
  if (notices.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-50 flex flex-col items-end gap-2 sm:left-auto sm:w-96">
      {notices.map((n) => (
        <div
          key={n.id}
          role="alert"
          className="pointer-events-auto flex w-full items-start gap-3 rounded-md border border-magenta bg-paper p-3 text-sm shadow-lg"
        >
          <p className="flex-1">{t(n.key, n.params)}</p>
          <button
            type="button"
            onClick={() => dismiss(n.id)}
            aria-label={t('notice.dismiss')}
            title={t('notice.dismiss')}
            className="rounded p-0.5 text-subtle hover:bg-ink/10"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}
