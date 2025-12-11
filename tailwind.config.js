/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      transitionDuration: {
        'DEFAULT': '150ms',
        'fast': '150ms',
      },
      colors: {
        cream: '#FDF5E6',
        paper: '#FFFEF9',
        sketch: '#2C2C2C',
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
      },
    },
  },
  plugins: [],
}
