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
        ink: {
          950: '#0B1220',
          900: '#111A2E',
          850: '#162138',
          800: '#1B2537',
          700: '#28364F',
          600: '#3D4D6B',
        },
        paper: {
          50: '#FAF8F4',
          100: '#F2EFE8',
          200: '#E8E4DA',
          300: '#DCD6C8',
        },
        sage: {
          50: '#F2F8F5',
          100: '#DCEDE3',
          200: '#B8DCC8',
          300: '#8AC3A6',
          400: '#5FA987',
          500: '#3E8E6D',
          600: '#317357',
          700: '#255843',
        },
        coral: {
          DEFAULT: '#D96C5F',
          50: '#FDF2F0',
          100: '#FBE4E1',
          500: '#D96C5F',
          600: '#C2574A',
        },
        amber: {
          400: '#E8A33D',
          500: '#D89128',
        },
        slate: {
          400: '#8A93A6',
          500: '#6C768A',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'glow-pulse': 'glowPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'subtle-pulse': 'subtlePulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 15px rgba(62, 142, 109, 0.4)' },
          '50%': { opacity: '0.7', boxShadow: '0 0 5px rgba(62, 142, 109, 0.1)' },
        },
        subtlePulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        }
      }
    },
  },
  plugins: [],
}
