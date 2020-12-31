import Koa from "koa";
import {render_page} from "../render";

export async function get_handler(ctx: Koa.ParameterizedContext, next: Koa.Next) {
  // readFile
  ctx.body = render_page("login", {body: {title: "Sidekick.js"}});
}

export async function post_handler(ctx: Koa.ParameterizedContext, next: Koa.Next) {
  let {password} : {password: string} = ctx.request.body;
  // console.log(ctx);
  if(password === process.env.SIDEKICK_MASTER_PASSWORD) {
    ctx.body = render_page("backend", {body: {sidebar: {title: "Sidekick.js"}}, header: {title: "Sidekick.js"}});
    
  } else {
    ctx.body = "INVALID PASSWORD";
  }
}