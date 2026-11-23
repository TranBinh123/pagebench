'use client';

import { useState } from 'react';
import {
  Combine,
  Download,
  FileArchive,
  Layers,
  Moon,
  Redo2,
  RotateCcw,
  RotateCw,
  Scissors,
  Sun,
  Trash2,
  Undo2,
  Ungroup,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportWorkspace } from '@/lib/export-actions';
import { useT } from '@/lib/i18n';
import { useSettings } from '@/lib/store/settings';
import { useWorkspace } from '@/lib/store/workspace';

const Divider = () => <span aria-hidden className="mx-1 hidden h-6 w-px shrink-0 bg-line sm:block" />;
const Label = ({ children }: { children: React.ReactNode }) => <span className="hidden lg:inline">{children}</span>;

export function Toolbar() {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const theme = useSettings((s) => s.theme);
  const setLang = useSettings((s) => s.setLang);
  const toggleTheme = useSettings((s) => s.toggleTheme);

  const docCount = useWorkspace((s) => s.documents.length);
  const selectedDocs = useWorkspace((s) => s.selectedDocIds.length);
  const selectedPages = useWorkspace((s) => s.selectedPageIds.length);
  const canUndo = useWorkspace((s) => s.past.length > 0);
  const canRedo = useWorkspace((s) => s.future.length > 0);
  const busy = useWorkspace((s) => s.busy !== null);
  const [removeOriginal, setRemoveOriginal] = useState(false);

  const ws = useWorkspace.getState;
  const hasDocs = docCount > 0;

  return (
    <header className="border-b border-line bg-paper">
      <div className="flex items-center gap-2 px-3 py-2">
        <h1 className="mr-2 text-lg font-bold tracking-tight">Pagebench</h1>
        <Button size="icon" variant="ghost" title={t('toolbar.undo')} aria-label={t('toolbar.undo')} disabled={!canUndo} onClick={() => ws().undo()}>
          <Undo2 className="h-4 w-4" aria-hidden />
        </Button>
        <Button size="icon" variant="ghost" title={t('toolbar.redo')} aria-label={t('toolbar.redo')} disabled={!canRedo} onClick={() => ws().redo()}>
          <Redo2 className="h-4 w-4" aria-hidden />
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Button size="icon" variant="ghost" title={t('toolbar.lang')} aria-label={t('toolbar.lang')} className="w-10 font-semibold" onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}>
            {lang === 'vi' ? 'VI' : 'EN'}
          </Button>
          <Button size="icon" variant="ghost" title={t('toolbar.theme')} aria-label={t('toolbar.theme')} onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
          </Button>
          <Button variant="solid" title={t('toolbar.exportPdf')} aria-label={t('toolbar.exportPdf')} disabled={!hasDocs || busy} onClick={() => void exportWorkspace(false)}>
            <Download className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">{t('toolbar.exportPdf')}</span>
          </Button>
          <Button title={t('toolbar.exportZip')} aria-label={t('toolbar.exportZip')} disabled={!hasDocs || busy} onClick={() => void exportWorkspace(true)}>
            <FileArchive className="h-4 w-4" aria-hidden />
            <span className="hidden md:inline">{t('toolbar.exportZip')}</span>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto border-t border-line px-3 py-2">
        <Button title={t('toolbar.mergeSelected')} aria-label={t('toolbar.mergeSelected')} disabled={selectedDocs < 2} onClick={() => ws().mergeSelected()}>
          <Combine className="h-4 w-4" aria-hidden />
          <Label>{t('toolbar.mergeSelected')}</Label>
        </Button>
        <Button title={t('toolbar.mergeAll')} aria-label={t('toolbar.mergeAll')} disabled={docCount < 2} onClick={() => ws().mergeAll()}>
          <Layers className="h-4 w-4" aria-hidden />
          <Label>{t('toolbar.mergeAll')}</Label>
        </Button>

        <Divider />

        <Button title={t('toolbar.splitRange')} aria-label={t('toolbar.splitRange')} disabled={selectedPages === 0} onClick={() => ws().splitSelection(removeOriginal)}>
          <Scissors className="h-4 w-4" aria-hidden />
          <Label>{t('toolbar.splitRange')}</Label>
        </Button>
        <Button title={t('toolbar.splitEach')} aria-label={t('toolbar.splitEach')} disabled={!hasDocs} onClick={() => ws().splitEach(removeOriginal)}>
          <Ungroup className="h-4 w-4" aria-hidden />
          <Label>{t('toolbar.splitEach')}</Label>
        </Button>
        <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-sm">
          <input type="checkbox" checked={removeOriginal} onChange={(e) => setRemoveOriginal(e.target.checked)} className="h-4 w-4 accent-magenta" />
          {t('toolbar.removeOriginal')}
        </label>

        <Divider />

        <Button variant="danger" title={t('toolbar.delete')} aria-label={t('toolbar.delete')} disabled={selectedPages === 0} onClick={() => ws().deleteSelectedPages()}>
          <Trash2 className="h-4 w-4" aria-hidden />
          <Label>{t('toolbar.delete')}</Label>
        </Button>

        <Divider />

        <Button title={`${t('toolbar.rotateLeft')}. ${t('toolbar.rotateHint')}`} aria-label={t('toolbar.rotateLeft')} disabled={!hasDocs} onClick={() => ws().rotate(-90)}>
          <RotateCcw className="h-4 w-4" aria-hidden />
          <Label>90°</Label>
        </Button>
        <Button title={`${t('toolbar.rotateRight')}. ${t('toolbar.rotateHint')}`} aria-label={t('toolbar.rotateRight')} disabled={!hasDocs} onClick={() => ws().rotate(90)}>
          <RotateCw className="h-4 w-4" aria-hidden />
          <Label>90°</Label>
        </Button>
        <Button title={`${t('toolbar.rotate180')}. ${t('toolbar.rotateHint')}`} aria-label={t('toolbar.rotate180')} disabled={!hasDocs} onClick={() => ws().rotate(180)}>
          <RotateCw className="h-4 w-4" aria-hidden />
          <span>180°</span>
        </Button>
      </div>
    </header>
  );
}
