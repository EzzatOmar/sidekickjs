import Koa from "koa";
import {readFileSync} from "fs";

export async function get_handler(ctx: Koa.ParameterizedContext, next: Koa.Next) {
  // readFile
  let file = readFileSync("./public/html/admin/index.html", "utf-8")
  ctx.body = file;
}