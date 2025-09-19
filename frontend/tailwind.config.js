/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // HOA Nexus Brand Colors
        royal: {
          50: '#eff6ff',
          100: '#dbeafe', 
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb', // Primary blue
          700: '#1d4ed8',
          800: '#1e40af', // Banner blue
          900: '#1e3a8a', // Dark blue
        },
        aqua: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee', // Logo accent color
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        // Dark mode specific colors
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b', // Dark backgrounds
          900: '#0f172a', // Darkest background
        },
      },
      // Theme-aware utilities
      backgroundColor: {
        'surface': 'var(--surface-color)',
        'surface-secondary': 'var(--surface-secondary-color)',
        'surface-tertiary': 'var(--surface-tertiary-color)',
      },
      textColor: {
        'primary': 'var(--text-primary-color)',
        'secondary': 'var(--text-secondary-color)',
        'tertiary': 'var(--text-tertiary-color)',
      },
      borderColor: {
        'primary': 'var(--border-primary-color)',
        'secondary': 'var(--border-secondary-color)',
      },
    },
  },
  plugins: [],
}
