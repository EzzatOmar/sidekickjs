const fs = require('fs');

async function get (ctx, next) {
  try {
    ctx.body = ctx.sidekick.render(__dirname + '/index.html', ctx.sidekick.view);
    ctx.set('Content-Type', 'text/html');
  } catch (e) {
    ctx.body = e.message + '\n' + __dirname;
  }
}

async function post (ctx, next) {
  ctx.body = "User post response.\nYou find me in /dist/pages/user/handler.js";
}

module.exports = {get, post}