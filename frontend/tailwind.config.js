/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'void': '#030005',       // Почти черный, но с фиолетовым отливом
        'glass-dark': 'rgba(10, 10, 16, 0.6)',

        // TRON Colors
        'cyan': '#00f3ff',
        'orange': '#ff9e00',

        // BLADE RUNNER Colors
        'purple': '#bc13fe',
        'pink': '#ff0055',
        'haze': '#2d2b55',       // Цвет тумана
      },
      fontFamily: {
        sans: ['"Orbitron"', 'sans-serif'],
        mono: ['"Share Tech Mono"', 'monospace'],
      },
      boxShadow: {
        'neon': '0 0 10px rgba(0, 243, 255, 0.5), 0 0 30px rgba(188, 19, 254, 0.3)',
        'glass': 'inset 0 0 20px rgba(255,255,255,0.05), 0 0 15px rgba(0,0,0,0.3)',
      },
      backgroundImage: {
        'gradient-liquid': 'linear-gradient(45deg, #00f3ff, #bc13fe, #ff0055)',
        'grid-pattern': `linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)`,
      },
      animation: {
        'liquid': 'liquid 8s ease infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        liquid: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
