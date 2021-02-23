import { ParameterizedContext, Next } from "koa";
import {query, getClient } from "../database/core";
import {genJWT} from "../utils/jwt";
import {render_html} from "../render";

/**
 * Injects sidekick object to context
 */
export async function inject_sidekick (ctx:ParameterizedContext, next:Next) {
  ctx.sidekick = {
    db: { admin: { query, getClient } },
    view: {
      jwt: ctx.user,
      prod: (process.env.ENVIRONMENT as string).toLowerCase() === 'prod',
      staging: (process.env.ENVIRONMENT as string).toLowerCase() === 'staging',
      local: (process.env.ENVIRONMENT as string).toLowerCase() === 'local',
      protocol: process.env.DOMAIN === 'localhost' ? 'http://' : 'https://',
      domain: `${process.env.DOMAIN}${process.env.DOMAIN === 'localhost' ? ':' + process.env.WEB_PORT : ''}`
    },
    render: render_html,
    genJWT
  }
  await next();
}