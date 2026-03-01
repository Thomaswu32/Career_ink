import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0A0F1E',
          blue: '#1E90FF',
          cyan: '#00BFFF',
          white: '#F4F6F8',
          silver: '#A8B4C8',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#F1F5F9',
        },
        text: {
          primary: '#0A0F1E',
          secondary: '#64748B',
        },
        border: '#E2E8F0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 8px rgba(10,15,30,0.10)',
        panel: '0 4px 24px rgba(10,15,30,0.15)',
      },
      borderRadius: {
        btn: '8px',
        card: '12px',
        pill: '999px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-dot': 'pulseDot 1.5s ease-in-out infinite',
        // shake animation referenced by SkillChip component
        'shake': 'shake 0.6s ease-in-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.3)', opacity: '0.7' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '15%':       { transform: 'translateX(-5px)' },
          '30%':       { transform: 'translateX(5px)' },
          '45%':       { transform: 'translateX(-4px)' },
          '60%':       { transform: 'translateX(4px)' },
          '75%':       { transform: 'translateX(-2px)' },
          '90%':       { transform: 'translateX(2px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
