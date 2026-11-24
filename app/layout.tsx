import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/bricolage-grotesque';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'Pagebench',
  description: 'Merge, split, delete and rotate PDF pages in one workspace. Runs entirely in your browser.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Paint under the notch / home indicator; the header pads itself with env(safe-area-inset-*).
  viewportFit: 'cover',
  // The header is the same navy in both color schemes, so one value matches the status bar in each.
  themeColor: '#0c1b48',
};

const themeScript = `(function(){try{var t=localStorage.getItem('pagebench-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
