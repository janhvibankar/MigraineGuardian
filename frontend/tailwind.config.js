/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F7F6F2',
        brand: {
          dark: '#26352F',
          sage: '#A8B9A5',
          'sage-light': '#DCE4DA',
          'sage-dark': '#8A9D87',
          teal: '#6F9990',
          'teal-light': '#D6E5E2',
          'teal-dark': '#557A72',
        },
        card: {
          warm: '#EFEEE8',
          'warm-light': '#F4F3EE',
          'warm-border': '#DFDCD1',
          'warm-hover': '#EAE8DF',
        },
        muted: {
          text: '#737873',
          'text-light': '#939993',
          'text-dark': '#484E48',
          border: '#E3E1D7',
          surface: '#F1EFE8',
        },
        alert: {
          muted: '#C98278',
          'muted-light': '#F8ECE9',
          'muted-border': '#E8BDB6',
        }
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        // Design system typography scale
        'marketing-xl': ['44px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '600' }],
        'marketing-lg': ['36px', { lineHeight: '1.25', letterSpacing: '-0.02em', fontWeight: '600' }],
        'app-xl': ['28px', { lineHeight: '1.3', letterSpacing: '-0.015em', fontWeight: '600' }],
        'app-lg': ['24px', { lineHeight: '1.35', letterSpacing: '-0.01em', fontWeight: '600' }],
        'section-lg': ['20px', { lineHeight: '1.4', letterSpacing: '-0.01em', fontWeight: '500' }],
        'section-md': ['18px', { lineHeight: '1.45', fontWeight: '500' }],
        'body-lg': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '1.6', fontWeight: '400' }],
        'meta-md': ['13px', { lineHeight: '1.5', fontWeight: '400' }],
        'meta-sm': ['12px', { lineHeight: '1.5', fontWeight: '500' }],
      },
      borderRadius: {
        'card': '18px',
        'card-lg': '20px',
        'card-sm': '16px',
        'btn': '12px',
        'input': '12px',
      },
      boxShadow: {
        'soft': '0 2px 10px -2px rgba(38, 53, 47, 0.04), 0 1px 3px rgba(38, 53, 47, 0.02)',
        'soft-md': '0 4px 16px -2px rgba(38, 53, 47, 0.05), 0 2px 6px rgba(38, 53, 47, 0.03)',
        'soft-lg': '0 10px 30px -4px rgba(38, 53, 47, 0.07), 0 4px 10px rgba(38, 53, 47, 0.03)',
      },
    },
  },
  plugins: [],
};
