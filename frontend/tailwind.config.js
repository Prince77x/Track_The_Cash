/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Law Enforcement / Government Neutral Palette
        lea: {
          950: '#070B14',
          900: '#0B1120',
          850: '#101B33',
          800: '#172544',
          700: '#253760',
          600: '#3B5282',
          500: '#64748B',
          accent: '#38BDF8',
          primary: '#2563EB',
          secondary: '#6366F1',
        },
        // Threat / Risk Rating Color Scale
        risk: {
          low: '#10B981',      // Emerald Green
          medium: '#F59E0B',   // Amber
          high: '#EF4444',     // Bright Red
          critical: '#DC2626', // Deep Crimson
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'tactical': '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 0 15px 0 rgba(56, 189, 248, 0.05)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.35)',
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.35)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.35)',
      }
    },
  },
  plugins: [],
}
