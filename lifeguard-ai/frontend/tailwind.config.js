/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0B0B',
        accent: {
          500: '#FF3B30',
          600: '#E02A20',
          DEFAULT: '#FF3B30',
        },
        surface: {
          dark: 'rgba(255, 255, 255, 0.02)',
          light: 'rgba(255, 255, 255, 0.05)',
        },
        text: {
          primary: '#F5F5F5',
          secondary: '#8E8E93',
        },
        risk: {
          low: '#10b981', // keeping some standard colors for risk levels, but we can mute them
          moderate: '#f59e0b',
          high: '#f97316',
          critical: '#FF3B30',
        },
      },
      fontFamily: {
        mono: ['DM Mono', 'Fira Mono', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
