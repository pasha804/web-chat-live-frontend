/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        rose: {
          950: '#1a0010',
          900: '#2d0018',
          800: '#4a0028',
        },
        // top-level so `bg-pink-glow`, `text-pink-glow`, etc. work
        'pink-glow': '#ff2d6b',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.35s ease forwards',
        'pulse-heart': 'pulseHeart 0.6s ease',
        float: 'float 3s ease-in-out infinite',
        glow: 'glow 2s ease-in-out infinite alternate',
        nudge: 'nudge 0.5s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseHeart: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.4)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glow: {
          from: { boxShadow: '0 0 20px rgba(255, 45, 107, 0.3)' },
          to: { boxShadow: '0 0 40px rgba(255, 45, 107, 0.7)' },
        },
        nudge: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-10px) rotate(-1deg)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(10px) rotate(1deg)' },
        },
      },
      backgroundImage: {
        'love-gradient': 'linear-gradient(135deg, #0d0010 0%, #1a0018 40%, #2d0025 100%)',
        'card-gradient': 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,45,107,0.05) 100%)',
        'msg-own': 'linear-gradient(135deg, #c2185b 0%, #e91e63 50%, #ff4081 100%)',
        'msg-other': 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)',
      },
    },
  },
  plugins: [],
};
