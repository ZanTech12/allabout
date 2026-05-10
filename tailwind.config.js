/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        jm: {
          orange: '#f68b1e',
          darkOrange: '#e07a10',
          dark: '#363636',
          darkHover: '#2a2a2a',
          light: '#f5f5f5',
          gray: '#8c8c8c',
          border: '#e0e0e0',
          red: '#e74c3c',
          green: '#27ae60',
          blue: '#3498db',
          white: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      screens: {
        xs: '374px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0, 0, 0, 0.06)',
        md: '0 4px 12px rgba(0, 0, 0, 0.08)',
        lg: '0 8px 25px rgba(0, 0, 0, 0.12)',
      },
      borderRadius: {
        sm: '4px',
      },
      transitionDuration: {
        fast: '150ms',
        base: '250ms',
        slow: '400ms',
      },
      animation: {
        'form-slide-down': 'formSlideDown 0.3s ease-out',
        'row-fade-in': 'rowFadeIn 0.3s ease-out both',
        'table-shimmer': 'tableShimmer 1.4s ease infinite',
        'btn-spinner': 'btnSpinner 0.6s linear infinite',
        'category-tap': 'categoryTap 0.2s ease',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
      },
      keyframes: {
        formSlideDown: {
          '0%': { opacity: '0', transform: 'translateY(-12px)', maxHeight: '0' },
          '100%': { opacity: '1', transform: 'translateY(0)', maxHeight: '600px' },
        },
        rowFadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        tableShimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        btnSpinner: {
          to: { transform: 'translateY(-50%) rotate(360deg)' },
        },
        categoryTap: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.92)' },
          '100%': { transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};