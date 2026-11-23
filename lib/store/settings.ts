import { create } from 'zustand';

export type Lang = 'vi' | 'en';
export type Theme = 'light' | 'dark';

interface SettingsState {
  lang: Lang;
  theme: Theme;
  hydrate: () => void;
  setLang: (lang: Lang) => void;
  toggleTheme: () => void;
}

const applyTheme = (theme: Theme) => document.documentElement.classList.toggle('dark', theme === 'dark');

export const useSettings = create<SettingsState>((set, get) => ({
  lang: 'vi',
  theme: 'light',
  hydrate: () => {
    try {
      const lang = localStorage.getItem('pagebench-lang') === 'en' ? 'en' : 'vi';
      const stored = localStorage.getItem('pagebench-theme');
      const dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.lang = lang;
      set({ lang, theme: dark ? 'dark' : 'light' });
    } catch {
      /* storage unavailable */
    }
  },
  setLang: (lang) => {
    try {
      localStorage.setItem('pagebench-lang', lang);
    } catch {
      /* storage unavailable */
    }
    document.documentElement.lang = lang;
    set({ lang });
  },
  toggleTheme: () => {
    const theme: Theme = get().theme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem('pagebench-theme', theme);
    } catch {
      /* storage unavailable */
    }
    applyTheme(theme);
    set({ theme });
  },
}));
