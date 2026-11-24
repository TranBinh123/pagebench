import type { Config } from 'tailwindcss';

const c = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: 'class',
  // Hover styles only apply on devices that can hover, so a tapped button doesn't stay "hovered".
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        mat: c('mat'),
        grid: c('grid'),
        paper: c('paper'),
        ink: c('ink'),
        subtle: c('subtle'),
        line: c('line'),
        brand: c('brand'),
        sun: c('sun'),
        navy: c('navy'),
        header: c('header'),
      },
      fontFamily: {
        sans: ['"Bricolage Grotesque Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        sheet: '0 0 0 1px rgb(var(--line)), 0 10px 18px -12px rgb(0 0 0 / 0.45)',
      },
      keyframes: {
        indeterminate: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(300%)' },
        },
      },
      animation: {
        indeterminate: 'indeterminate 1.1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
