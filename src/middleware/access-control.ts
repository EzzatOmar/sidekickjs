import { ParameterizedContext, Next } from "koa";
import {verify} from "jsonwebtoken";

export async function authViaJWT (ctx:ParameterizedContext, next:Next) {
  let bearer:string = ctx.request.headers.authorization;
  if(!bearer) {
    ctx.user = null;
    return next();
  }
  let jwtToken = bearer.startsWith('Bearer ')?bearer.slice(7):null;
  if(!jwtToken) {
    ctx.user = null;
    return next();
  }
  try {
    var payload = verify(jwtToken, process.env.JWT_SECRET as string);
    ctx.user = payload;
    return next();
  }catch(e) {
    ctx.user = null;
    return next();
  }
}

export async function authorizationOnlySidekickUser (ctx:ParameterizedContext, next:Next) {
  if(ctx.user && ctx.user.user_uuid && ctx.user.role === 'sidekick_user') {
    return next();
  } else {
    ctx.status = 401;
  }
}