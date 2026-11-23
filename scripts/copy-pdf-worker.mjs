import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const src = path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.js');
const destDir = path.join(process.cwd(), 'public');

if (!existsSync(src)) {
  console.warn('[pagebench] pdf.worker.min.js not found, run npm install first');
} else {
  mkdirSync(destDir, { recursive: true });
  copyFileSync(src, path.join(destDir, 'pdf.worker.min.js'));
}
