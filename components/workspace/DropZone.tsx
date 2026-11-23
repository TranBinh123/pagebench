'use client';

import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n';

export function DropZone({ onAdd }: { onAdd: () => void }) {
  const t = useT();
  return (
    <div className="mat-grid flex flex-1 items-center justify-center p-6">
      <div className="flex max-w-md flex-col items-center gap-4 rounded-lg border-2 border-dashed border-ink/30 bg-paper px-8 py-12 text-center">
        <Upload className="h-8 w-8 text-subtle" aria-hidden />
        <h2 className="text-xl font-semibold tracking-tight">{t('drop.title')}</h2>
        <p className="text-sm leading-relaxed text-subtle">{t('drop.sub')}</p>
        <Button variant="solid" onClick={onAdd}>
          {t('drop.button')}
        </Button>
      </div>
    </div>
  );
}
