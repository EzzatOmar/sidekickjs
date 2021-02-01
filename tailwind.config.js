// tailwind.config.js
module.exports = {
  purge: [
    './resources/private/html/**/*.html',
    './resources/private/html/**/*.handlebars'
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {},
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
