import Koa from "koa";
import {readFileSync} from "fs";

export async function get_handler(ctx: Koa.ParameterizedContext, next: Koa.Next) {
  // readFile
  let file = readFileSync("./public/html/admin/index.html", "utf-8")
  ctx.body = file;
}

export async function post_handler(ctx: Koa.ParameterizedContext, next: Koa.Next) {
  let {password} : {password: string} = ctx.request.body;
  // console.log(ctx);
  if(password === process.env.SIDEKICK_MASTER_PASSWORD) {
    ctx.body = "OK";
  } else {
    ctx.body = "INVALID PASSWORD";
  }
}