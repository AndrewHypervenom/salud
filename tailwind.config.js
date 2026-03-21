/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          50:  '#fff7ed',
          100: '#ffedd5',
          300: '#fdba74',
          400: '#fb923c',
          500: '#FF9500',
          600: '#ea7d00',
          700: '#c26200',
          900: '#7c3f00',
        },
        ios: {
          blue:   '#007AFF',
          green:  '#30D158',
          red:    '#FF3B30',
          orange: '#FF9500',
          yellow: '#FFD60A',
          purple: '#BF5AF2',
          teal:   '#32ADE6',
          indigo: '#5856D6',
          pink:   '#FF2D55',
          cyan:   '#5AC8F5',
          gray:   '#8E8E93',
          bg:     '#F2F2F7',
          card:   '#FFFFFF',
          dark:   '#1C1C1E',
          dark2:  '#2C2C2E',
          dark3:  '#3A3A3C',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'ios-sm':     '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'ios':        '0 2px 12px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
        'ios-md':     '0 4px 20px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.05)',
        'ios-lg':     '0 8px 32px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)',
        'ios-colored-blue':   '0 6px 20px rgba(0,122,255,0.35)',
        'ios-colored-green':  '0 6px 20px rgba(48,209,88,0.35)',
        'ios-colored-red':    '0 6px 20px rgba(255,59,48,0.35)',
        'ios-colored-orange': '0 6px 20px rgba(255,149,0,0.35)',
        'ios-colored-purple': '0 6px 20px rgba(191,90,242,0.35)',
        'ios-colored-teal':   '0 6px 20px rgba(50,173,230,0.35)',
        'ios-colored-cyan':   '0 6px 20px rgba(90,200,245,0.35)',
        'ios-colored-indigo': '0 6px 20px rgba(88,86,214,0.35)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
