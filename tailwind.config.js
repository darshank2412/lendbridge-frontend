/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        ink: {
          950: '#0A0B0F',
          900: '#12141A',
          800: '#1C1F28',
          700: '#252934',
          600: '#363B4A',
          500: '#4A5060',
          400: '#6B7280',
          300: '#9CA3AF',
          200: '#D1D5DB',
          100: '#F3F4F6',
          50:  '#F9FAFB',
        },
        gold: {
          500: '#D4A853',
          400: '#E2BC72',
          300: '#EDD090',
          200: '#F5E4B8',
          100: '#FBF3DC',
        },
        emerald: {
          600: '#059669',
          500: '#10B981',
          400: '#34D399',
          100: '#D1FAE5',
          50:  '#ECFDF5',
        },
        ruby: {
          600: '#DC2626',
          500: '#EF4444',
          100: '#FEE2E2',
          50:  '#FEF2F2',
        },
        sapphire: {
          600: '#2563EB',
          500: '#3B82F6',
          400: '#60A5FA',
          100: '#DBEAFE',
          50:  '#EFF6FF',
        },
        amber: {
          600: '#D97706',
          500: '#F59E0B',
          100: '#FEF3C7',
          50:  '#FFFBEB',
        }
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease forwards',
        'fade-in': 'fadeIn 0.3s ease forwards',
        'slide-in': 'slideIn 0.35s ease forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(12px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideIn: {
          '0%': { opacity: 0, transform: 'translateX(-12px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.6 },
        }
      }
    },
  },
  plugins: [],
}
