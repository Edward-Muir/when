/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#f8fafc',
        'bg-secondary': '#f1f5f9',
        text: '#1e293b',
        'text-secondary': '#64748b',
        border: '#e2e8f0',
        accent: '#3b82f6',
        'accent-hover': '#2563eb',
        'accent-gold': '#b8860b', // Main game's accent color for year display
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
      },
    },
  },
  plugins: [],
};
