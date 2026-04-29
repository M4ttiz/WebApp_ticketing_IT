/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        surface: {
          main: '#0F1117',
          card: '#16181E',
          hover: '#1E2028',
          sidebar: '#0C0E13',
          elevated: '#1E2028',
        },
        border: {
          subtle: '#2A2D35',
          focus: '#4F6EF7',
          muted: '#3A3D45',
        },
        text: {
          primary: '#F0F2F7',
          secondary: '#8B8FA8',
          disabled: '#4A4E62',
        },
        accent: {
          DEFAULT: '#4F6EF7',
          hover: '#3D5CE6',
        },
        semantic: {
          success: '#22C55E',
          warning: '#F59E0B',
          danger: '#EF4444',
          info: '#06B6D4',
        },
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          400: '#4F6EF7',
          500: '#4F6EF7',
          600: '#3D5CE6',
        },
        status: {
          APERTO: '#4F6EF7',
          IN_LAVORAZIONE: '#F59E0B',
          IN_ATTESA: '#8B8FA8',
          RISOLTO: '#22C55E',
          CHIUSO: '#4A4E62',
          RIFIUTATO: '#EF4444',
        },
        priority: {
          BASSA: '#22c55e',
          MEDIA: '#4F6EF7',
          ALTA: '#F59E0B',
          CRITICA: '#EF4444',
        },
      },
      borderRadius: {
        ds: '8px',
        'ds-sm': '4px',
        'ds-lg': '12px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        elevated: '0 4px 16px rgba(0,0,0,0.5)',
        focus: '0 0 0 3px rgba(79,110,247,0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-skeleton': 'pulseSkeleton 1.5s ease-in-out infinite',
        'status-pulse': 'statusPulse 2s ease-in-out infinite',
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
        statusPulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(0.92)' },
        },
      },
    },
  },
  plugins: [],
}
