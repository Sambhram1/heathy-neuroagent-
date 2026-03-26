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
          500: '#E5E5E5',
          600: '#BFBFBF',
          DEFAULT: '#E5E5E5',
        },
        surface: {
          dark: 'rgba(255, 255, 255, 0.02)',
          light: 'rgba(255, 255, 255, 0.05)',
        },
        text: {
          primary: '#F5F5F5',
          secondary: '#8E8E93',
          muted: '#8E8E93',
        },
        risk: {
          low: '#F5F5F5',
          moderate: '#C8C8C8',
          high: '#A7A7A7',
          critical: '#E5E5E5',
        },
      },
      fontFamily: {
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
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
