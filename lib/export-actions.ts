import { ExportError, runExport } from '@/lib/export-client';
import { downloadBlob, ensurePdfName } from '@/lib/pdf/utils';
import { useWorkspace } from '@/lib/store/workspace';

export async function exportWorkspace(zip: boolean) {
  const state = useWorkspace.getState();
  if (state.busy) return;
  if (state.documents.length === 0) {
    state.pushNotice('error.nothingToExport');
    return;
  }

  const perDoc = state.documents.map((doc) => ({
    name: ensurePdfName(doc.name),
    pages: doc.pages.map(({ srcId, index, rotation }) => ({ srcId, index, rotation })),
  }));
  const jobs = zip ? perDoc : [{ name: 'pagebench.pdf', pages: perDoc.flatMap((job) => job.pages) }];
  const key = zip ? 'progress.zip' : 'progress.export';

  state.setBusy({ key, progress: 0 });
  try {
    const blob = await runExport(jobs, zip, (progress) => useWorkspace.getState().setBusy({ key, progress }));
    downloadBlob(blob, zip ? 'pagebench.zip' : 'pagebench.pdf');
  } catch (error) {
    if (error instanceof ExportError && error.code === 'encrypted') {
      useWorkspace.getState().pushNotice('error.exportEncrypted');
    } else {
      useWorkspace.getState().pushNotice('error.export', { msg: (error as Error).message });
    }
  } finally {
    useWorkspace.getState().setBusy(null);
  }
}
