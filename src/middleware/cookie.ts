import {cookieToObject} from "../utils/cookie";
import { ParameterizedContext, Next } from "koa";

export async function jwtCookeToBearer (ctx:ParameterizedContext, next:Next) {
  if(ctx.request && ctx.request.headers && !!ctx.request.headers.cookie){
    let cookie = cookieToObject(ctx.request.headers.cookie);
    if(cookie.jwt){
      ctx.request.headers.authorization = 'Bearer ' + cookie.jwt;
    }
  }
  return next();
}