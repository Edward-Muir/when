/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      height: {
        'dvh': '100dvh',
        'screen-safe': 'calc(var(--vh, 1vh) * 100)',
      },
      minHeight: {
        'dvh': '100dvh',
        'screen-safe': 'calc(var(--vh, 1vh) * 100)',
      },
      padding: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      transitionDuration: {
        'DEFAULT': '150ms',
        'fast': '150ms',
      },
      opacity: {
        'ghost': '0.5',  // Ghost card opacity - used in Timeline and DraggableCard
      },
      colors: {
        // Semantic tokens - reference CSS variables from index.css
        // To change colors, edit :root and .dark in src/index.css
        'bg': 'var(--color-bg)',
        'surface': 'var(--color-surface)',
        'text': 'var(--color-text)',
        'text-muted': 'var(--color-text-muted)',
        'border': 'var(--color-border)',
        'accent': 'var(--color-accent)',
        'accent-secondary': 'var(--color-accent-secondary)',
        'success': 'var(--color-success)',
        'error': 'var(--color-error)',
        // Keep for overlays and utilities
        'transparent': 'transparent',
        'white': '#FFFFFF',
        'black': '#000000',
      },
      fontFamily: {
        'display': ['Playfair Display', 'Georgia', 'serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['DM Mono', 'Courier New', 'monospace'],
      },
      fontSize: {
        // Centralized UI text sizes - edit here to update all UI text
        'ui-title': ['2.9rem', { lineHeight: '1.2', fontWeight: '700' }],     // "When?" title
        'ui-body': ['1.2rem', { lineHeight: '2.0' }],                         // Turn/Score
        'ui-label': ['0.9rem', { lineHeight: '1.0' }],                        // "Drag to timeline"
        'ui-caption': ['0.9rem', { lineHeight: '1.0' }],                      // "Tap for details"
        'ui-card-title': ['0.9rem', { lineHeight: '1.2', fontWeight: '600' }], // Card title overlay
      },
      animation: {
        'shake': 'shake 0.5s ease-in-out',
        'screen-shake': 'screenShake 0.4s ease-in-out',
        'entrance': 'entrance 0.25s ease-out forwards',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
        },
        screenShake: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translate(-2px, 0)' },
          '20%, 40%, 60%, 80%': { transform: 'translate(2px, 0)' },
        },
        entrance: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        // Dark mode shadows
        'card-rest-dark': '2px 2px 12px rgba(0, 0, 0, 0.4)',
        'card-placed-dark': '1px 1px 6px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
}
