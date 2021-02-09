import { ParameterizedContext, Next } from "koa";

export async function catchException (ctx:ParameterizedContext, next:Next) {
  try {
    await next();
  } catch (err) {
    console.log(err);
    ctx.response.status = 500;
  }
}


