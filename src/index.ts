// const Koa = require("koa");
import Koa from "koa";
import Router from "koa-router";
import pg from "pg";
import { Map } from "immutable";

const foo = Map<String, Number>([["Hello", 12]])
const app = new Koa();
const router = new Router();
1+1;

router.get("/", (ctx:Koa.ParameterizedContext, next) => {
  ctx.body = "HELLO";
  
  
})

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3000);
console.log('HELLO TS', foo.toJSON(),";", 12, "sas");
console.log('12')