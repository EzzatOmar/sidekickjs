import { ParameterizedContext, Next } from "koa";
import { RateLimiterMemory, IRateLimiterRes } from "rate-limiter-flexible";

// means that the user-agent has 200 points every 2 seconds
const rateLimiter = new RateLimiterMemory({
  points: 200,
  duration: 2, // Store number for two second
  blockDuration: 60, // Block for 1 minute
});

export async function rateLimitMW (ctx:ParameterizedContext, next:Next) {
  try {
    await rateLimiter.consume(ctx.ip);
    await next();
  } catch (rejRes) {
    let r: IRateLimiterRes = rejRes;
    ctx.response.status = 429;
    ctx.response.body = 'Too Many Requests';
    // @ts-ignore
    ctx.response.set('Retry-After', '' + (r.msBeforeNext | 60000) / 1000);
  }
}


