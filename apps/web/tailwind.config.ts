import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    screens: {
      xs: '400px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        primary: {
          50: 'var(--color-primary-50, #f5f3ff)',
          100: 'var(--color-primary-100, #ede9fe)',
          200: 'var(--color-primary-200, #ddd6fe)',
          300: 'var(--color-primary-300, #c4b5fd)',
          400: 'var(--color-primary-400, #a78bfa)',
          500: 'var(--color-primary-500, #8b5cf6)',
          600: 'var(--color-primary-600, #7c3aed)',
          700: 'var(--color-primary-700, #6d28d9)',
          800: 'var(--color-primary-800, #5b21b6)',
          900: 'var(--color-primary-900, #4c1d95)',
        },
        secondary: {
          400: 'var(--color-secondary-400, #f472b6)',
          500: 'var(--color-secondary-500, #ec4899)',
          600: 'var(--color-secondary-600, #db2777)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
} satisfies Config;
