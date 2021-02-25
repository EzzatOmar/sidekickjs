// tailwind.config.js
module.exports = {
  purge: [
    './resources/private/html/**/*.html',
    './resources/private/html/**/*.handlebars',
    './custom/dist/admin/**/*.html'
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
