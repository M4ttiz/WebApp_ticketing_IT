/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
        },
        status: {
          APERTO: '#3b82f6',
          IN_LAVORAZIONE: '#f97316',
          IN_ATTESA: '#eab308',
          RISOLTO: '#22c55e',
          CHIUSO: '#64748b',
          RIFIUTATO: '#ef4444',
        },
        priority: {
          BASSA: '#22c55e',
          MEDIA: '#3b82f6',
          ALTA: '#f97316',
          CRITICA: '#ef4444',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-skeleton': 'pulseSkeleton 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSkeleton: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
};

