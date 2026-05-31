/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{html,ts}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#004ac6",
        "on-primary": "#ffffff",
        background: "#f7f9fb",
        secondary: "#565e74",
        "secondary-container": "#dde1f9",
        "on-secondary-container": "#141b2c",
        tertiary: "#76546d",
        "on-tertiary": "#ffffff",
        surface: "#ffffff",
        "on-surface": "#1a1b1f",
        "surface-variant": "#e1e2ec",
        "on-surface-variant": "#44474e",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f7f9fb",
        "surface-container": "#f1f4f9",
        "surface-container-high": "#ebeef4",
        "surface-container-highest": "#e5e8ef",
        outline: "#c3c6d7",
        "outline-variant": "#c4c7c5"
      },
      spacing: {
        'stack-sm': '0.5rem',
        'stack-md': '1rem',
        'stack-lg': '1.5rem',
        'gutter': '1.5rem'
      },
      fontSize: {
        'h2': ['1.5rem', { lineHeight: '2rem', fontWeight: '700' }],
        'body-md': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],
        'label-md': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '500' }],
        'label-sm': ['0.75rem', { lineHeight: '1rem', fontWeight: '500' }],
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      }
    },
  },
  plugins: [],
}