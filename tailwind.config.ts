import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#D4A017',
          light:   '#F0C040',
          dark:    '#A07812',
          faint:   'rgba(212,160,23,0.08)',
        },
        maroon: {
          DEFAULT: '#7B1C2A',
          dark:    '#5A1220',
          light:   '#A0293B',
        },
        cream:    '#FBF5E6',
        charcoal: '#1C1C1E',
      },
      fontFamily: {
        cairo:   ['var(--font-cairo)', 'sans-serif'],
        tajawal: ['var(--font-tajawal)', 'sans-serif'],
        noto:    ['var(--font-noto-sans-arabic)', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px',
        md: '14px',
        lg: '24px',
        xl: '36px',
      },
      boxShadow: {
        gold: '0 0 30px rgba(212,160,23,0.25)',
        card: '0 8px 32px rgba(0,0,0,0.45)',
      },
      animation: {
        'fade-up':   'fadeUp 0.7s ease-out both',
        'fade-in':   'fadeIn 0.5s ease-out both',
        'scale-in':  'scaleIn 0.5s ease-out both',
        'shimmer':   'shimmer 2.5s infinite',
        'marquee':   'marquee-rtl 30s linear infinite',
        'pulse-gold':'pulse-gold 2s infinite',
      },
      keyframes: {
        fadeUp:  { from: { opacity: '0', transform: 'translateY(30px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.92)' }, to: { opacity: '1', transform: 'scale(1)' } },
        'marquee-rtl': { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        'pulse-gold':  { '0%,100%': { boxShadow: '0 0 0 0 rgba(212,160,23,0.4)' }, '50%': { boxShadow: '0 0 0 10px rgba(212,160,23,0)' } },
      },
    },
  },
  plugins: [],
};
export default config;
