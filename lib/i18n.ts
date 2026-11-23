'use client';

import { useCallback } from 'react';
import { useSettings, type Lang } from '@/lib/store/settings';

const vi = {
  'tab.docs': 'Document',
  'tab.pages': 'Trang',
  'sidebar.title': 'Document',
  'sidebar.add': 'Thêm PDF',
  'sidebar.pages': '{n} trang',
  'sidebar.select': 'Chọn document {name}',
  'sidebar.remove': 'Bỏ document khỏi workspace',
  'sidebar.hint': 'Kéo để đổi thứ tự. Kéo trang thả vào một document để chuyển trang sang đó.',
  'drop.title': 'Thả file PDF vào đây',
  'drop.sub': 'Gộp, tách, xóa và xoay trang trên cùng một workspace. Mọi thứ chạy ngay trong trình duyệt, file không được gửi đi đâu.',
  'drop.button': 'Chọn file PDF',
  'drop.overlay': 'Thả để thêm vào workspace',
  'toolbar.undo': 'Hoàn tác (Ctrl+Z)',
  'toolbar.redo': 'Làm lại (Ctrl+Shift+Z)',
  'toolbar.mergeSelected': 'Gộp các document đã chọn',
  'toolbar.mergeAll': 'Gộp tất cả document',
  'toolbar.splitRange': 'Tách thành document mới',
  'toolbar.splitEach': 'Tách từng trang',
  'toolbar.removeOriginal': 'Xóa bản gốc sau khi tách',
  'toolbar.delete': 'Xóa trang',
  'toolbar.rotateRight': 'Xoay phải 90°',
  'toolbar.rotateLeft': 'Xoay trái 90°',
  'toolbar.rotate180': 'Xoay 180°',
  'toolbar.rotateHint': 'Áp dụng cho trang đã chọn, hoặc cả document nếu chưa chọn trang nào',
  'toolbar.exportPdf': 'Xuất PDF',
  'toolbar.exportZip': 'Xuất nhiều file (ZIP)',
  'toolbar.theme': 'Đổi giao diện sáng/tối',
  'toolbar.lang': 'Đổi ngôn ngữ',
  'range.label': 'Chọn trang',
  'range.placeholder': '1-3,5,7-10',
  'range.selected': 'Đã chọn {n}/{total} trang',
  'range.none': 'Chưa chọn trang nào',
  'range.invalid': 'Khoảng trang không hợp lệ. Ví dụ: 1-3,5,7-10',
  'range.outOfRange': 'Document này chỉ có {max} trang.',
  'pages.selectAll': 'Chọn tất cả',
  'pages.clear': 'Bỏ chọn',
  'pages.number': 'Trang {n}',
  'pages.empty': 'Chọn một document ở thanh bên để xem các trang.',
  'pages.dragCount': '{n} trang',
  'progress.loading': 'Đang đọc {name}',
  'progress.export': 'Đang ghép và xuất PDF',
  'progress.zip': 'Đang xuất và nén ZIP',
  'error.notPdf': '{name} không phải file PDF.',
  'error.corrupt': '{name} bị hỏng hoặc không đọc được.',
  'error.encrypted': '{name} có mật khẩu. Hãy gỡ mật khẩu rồi tải lại.',
  'error.deleteAll': 'Không thể xóa hết trang của một document. Chừa lại ít nhất 1 trang, hoặc bỏ cả document khỏi workspace.',
  'error.selectPages': 'Chọn trang trước: bấm vào trang hoặc nhập khoảng trang.',
  'error.needTwoDocs': 'Cần ít nhất 2 document để gộp.',
  'error.nothingToExport': 'Workspace đang trống, chưa có gì để xuất.',
  'error.export': 'Xuất file thất bại: {msg}',
  'error.exportEncrypted': 'Có file bị mã hóa nên không xuất được.',
  'notice.dismiss': 'Đóng',
} as const;

export type MessageKey = keyof typeof vi;

const en: Record<MessageKey, string> = {
  'tab.docs': 'Documents',
  'tab.pages': 'Pages',
  'sidebar.title': 'Documents',
  'sidebar.add': 'Add PDF',
  'sidebar.pages': '{n} pages',
  'sidebar.select': 'Select document {name}',
  'sidebar.remove': 'Remove document from workspace',
  'sidebar.hint': 'Drag to reorder. Drop pages onto a document to move them there.',
  'drop.title': 'Drop PDF files here',
  'drop.sub': 'Merge, split, delete and rotate pages in one workspace. Everything runs in your browser, files are never uploaded.',
  'drop.button': 'Choose PDF files',
  'drop.overlay': 'Drop to add to the workspace',
  'toolbar.undo': 'Undo (Ctrl+Z)',
  'toolbar.redo': 'Redo (Ctrl+Shift+Z)',
  'toolbar.mergeSelected': 'Merge selected documents',
  'toolbar.mergeAll': 'Merge all documents',
  'toolbar.splitRange': 'Split into new document',
  'toolbar.splitEach': 'Split every page',
  'toolbar.removeOriginal': 'Delete original after split',
  'toolbar.delete': 'Delete pages',
  'toolbar.rotateRight': 'Rotate right 90°',
  'toolbar.rotateLeft': 'Rotate left 90°',
  'toolbar.rotate180': 'Rotate 180°',
  'toolbar.rotateHint': 'Applies to selected pages, or the whole document when none are selected',
  'toolbar.exportPdf': 'Export PDF',
  'toolbar.exportZip': 'Export files (ZIP)',
  'toolbar.theme': 'Toggle light/dark theme',
  'toolbar.lang': 'Change language',
  'range.label': 'Select pages',
  'range.placeholder': '1-3,5,7-10',
  'range.selected': '{n} of {total} pages selected',
  'range.none': 'No pages selected',
  'range.invalid': 'Invalid page range. Example: 1-3,5,7-10',
  'range.outOfRange': 'This document has only {max} pages.',
  'pages.selectAll': 'Select all',
  'pages.clear': 'Clear',
  'pages.number': 'Page {n}',
  'pages.empty': 'Pick a document in the sidebar to see its pages.',
  'pages.dragCount': '{n} pages',
  'progress.loading': 'Reading {name}',
  'progress.export': 'Building and exporting PDF',
  'progress.zip': 'Exporting and zipping files',
  'error.notPdf': '{name} is not a PDF file.',
  'error.corrupt': '{name} is damaged and cannot be read.',
  'error.encrypted': '{name} is password protected. Remove the password and upload it again.',
  'error.deleteAll': 'A document cannot lose all of its pages. Keep at least 1 page, or remove the whole document from the workspace.',
  'error.selectPages': 'Select pages first: click a page or type a page range.',
  'error.needTwoDocs': 'You need at least 2 documents to merge.',
  'error.nothingToExport': 'The workspace is empty, there is nothing to export.',
  'error.export': 'Export failed: {msg}',
  'error.exportEncrypted': 'An encrypted file cannot be exported.',
  'notice.dismiss': 'Dismiss',
};

const dicts: Record<Lang, Record<MessageKey, string>> = { vi, en };

type Params = Record<string, string | number>;

export function translate(lang: Lang, key: MessageKey, params?: Params) {
  let text = dicts[lang][key];
  if (params) for (const [k, v] of Object.entries(params)) text = text.replaceAll(`{${k}}`, String(v));
  return text;
}

export function useT() {
  const lang = useSettings((s) => s.lang);
  return useCallback((key: MessageKey, params?: Params) => translate(lang, key, params), [lang]);
}
