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
      colors: {
        // Legacy colors (keep for compatibility during transition)
        cream: '#FDF5E6',
        paper: '#FFFEF9',
        sketch: '#2C2C2C',
        // Light theme
        'light-bg': '#FAF8F5',
        'light-card': '#FFFDF8',
        'light-text': '#2D2A26',
        'light-muted': '#6B6560',
        'light-border': '#E5E0D8',
        // Dark theme
        'dark-bg': '#1A1918',
        'dark-card': '#2A2826',
        'dark-text': '#E8E4DC',
        'dark-muted': '#9A948C',
        'dark-border': '#3D3A36',
        // Shared accent colors
        'accent': '#B8860B',
        'accent-dark': '#D4A84B',
        'success': '#6AAA64',
        'error': '#C9A0A0',
      },
      fontFamily: {
        'display': ['Playfair Display', 'Georgia', 'serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['DM Mono', 'Courier New', 'monospace'],
      },
      fontSize: {
        // Centralized UI text sizes - edit here to update all UI text
        'ui-title': ['3.0rem', { lineHeight: '1.2', fontWeight: '700' }],     // "When?" title
        'ui-body': ['1.2rem', { lineHeight: '2.0' }],                         // Turn/Score
        'ui-label': ['1.0rem', { lineHeight: '1.0' }],                        // "Drag to timeline"
        'ui-caption': ['1.0rem', { lineHeight: '1.0' }],                      // "Tap for details"
        'ui-card-title': ['0.9rem', { lineHeight: '1.2', fontWeight: '600' }], // Card title overlay
      },
      animation: {
        'card-hover': 'cardHover 0.2s ease-out forwards',
        'shake': 'shake 0.5s ease-in-out',
        'pulse-glow': 'pulseGlow 1.5s ease-in-out infinite',
        'slide-in': 'slideIn 0.3s ease-out forwards',
        'fade-out': 'fadeOut 1.5s ease-out forwards',
        'flip': 'flip 0.6s ease-in-out',
        'screen-shake': 'screenShake 0.4s ease-in-out',
        'entrance': 'entrance 0.25s ease-out forwards',
        'slide-to-position': 'slideToPosition 0.5s ease-out forwards',
      },
      keyframes: {
        cardHover: {
          '0%': { transform: 'scale(1) rotate(0deg)' },
          '100%': { transform: 'scale(1.1) rotate(-2deg)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(30, 144, 255, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(30, 144, 255, 0.8)' },
        },
        slideIn: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        flip: {
          '0%': { transform: 'rotateY(0deg)' },
          '50%': { transform: 'rotateY(90deg)' },
          '100%': { transform: 'rotateY(0deg)' },
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
        slideToPosition: {
          '0%': { opacity: '0.8' },
          '100%': { opacity: '1' },
        },
      },
      boxShadow: {
        'sketch': '3px 3px 0px rgba(0, 0, 0, 0.2)',
        'sketch-lg': '5px 5px 0px rgba(0, 0, 0, 0.2)',
        'card-rest': '2px 2px 8px rgba(0, 0, 0, 0.2)',
        'card-hover': '8px 8px 20px rgba(0, 0, 0, 0.25), 0 0 30px rgba(218, 165, 32, 0.15)',
        'card-dragging': '15px 15px 30px rgba(0, 0, 0, 0.35), 0 0 50px rgba(218, 165, 32, 0.2)',
        'card-placed': '1px 1px 3px rgba(0, 0, 0, 0.25)',
        // Dark mode shadows
        'card-rest-dark': '2px 2px 12px rgba(0, 0, 0, 0.4)',
        'card-placed-dark': '1px 1px 6px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
}
