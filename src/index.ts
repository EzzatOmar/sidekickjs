const dotenv = require("dotenv")
dotenv.config()

import Koa, { Next, ParameterizedContext } from "koa";
import websockify from "koa-websocket";
import Router from "koa-router";
import send from "koa-send";
import { postgraphile } from "postgraphile";
import { adminRouter } from "./admin/index";
import { run } from "graphile-worker";
import { mw_render_html } from "./render";
import { query } from "./database/admin";
import { jwtCookeToBearer } from "./middleware/cookie";
import { authViaJWT } from "./middleware/access-control";
import { rateLimitMW } from "./middleware/rate-limiter";
import { catchException } from "./middleware/exception";
import { inject_sidekick } from "./middleware/sidekick";
import { existsSync } from "fs";
import { getFileFromDir } from "./utils/files";
import { dynamic_mw } from "./dynamic_middleware";
import { CustomParameterizedContext } from "./types";

const SIDEKICK_API_CONNECTION_STRING = `postgres://sidekick_api:${process.env.PGUSER_API_PW}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;
const SIDEKICK_ADMIN_CONNECTION_STRING = `postgres://sidekick_admin:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;
const app = websockify(new Koa());

async function start_background_jobs() {
  let taskDirectory = `${__dirname}/../custom/dist/tasks`;
  console.log("taskDirectory", taskDirectory);
  if (existsSync(taskDirectory)) {
    // Run a worker to execute jobs:
    const runner = await run({
      connectionString: SIDEKICK_ADMIN_CONNECTION_STRING,
      concurrency: 5,
      // Install signal handlers for graceful shutdown on SIGINT, SIGTERM, etc
      noHandleSignals: false,
      pollInterval: 1000,

      // or:
      taskDirectory: taskDirectory
    });
    await runner.promise;

  } else {
    console.error(`No background worker started. Task directory is missing.`)
    return new Promise((resolve, reject) => {
      resolve({});
    })
  }
}

async function initAdminRouter() {
  app
    .use(adminRouter.routes())
    .use(adminRouter.allowedMethods());
}

async function initCustomRouter(customRouter?: Router<any, {}>, websocketRouter?: Router<any, {}>) {
  let handlerDirs = getFileFromDir("./custom/dist/pages", [], "handler\.js");
  console.log('Custom handler directories found: ', handlerDirs)
  if (!customRouter) {
    customRouter = new Router();
  }
  if (!websocketRouter) {
    websocketRouter = new Router();
  }

  console.log('Searching for custom handler');

  
  handlerDirs.forEach(path => {
    let handler = require('../' + path);
    console.log('handler found:', handler);
    let handlerPath = "/" + path.split('/').splice(3).slice(0, -1).join('/');
    
    // websocket router which needs to be put in app.ws.use
    if (typeof handler.websocket === 'function') {
      if (typeof handler.websocket_mw === 'function') {
        // @ts-ignore 
        websocketRouter.all(handlerPath, handler.websocket_mw, handler.websocket);
      }
      // @ts-ignore 
      websocketRouter.all(handlerPath, handler.websocket);
    }

    if (typeof handler.get === 'function') {
      console.log('insert get')
      if (typeof handler.get_mw === 'function') {
        // @ts-ignore 
        customRouter.get(handlerPath, handler.get_mw, handler.get);
      } else {
        // @ts-ignore 
        customRouter.get(handlerPath, handler.get);
      }
    }
    if (typeof handler.post === 'function') {
      if (typeof handler.post_mw === 'function') {
        // @ts-ignore 
        customRouter.post(handlerPath, handler.post_mw, handler.post);
      } else {
        // @ts-ignore 
        customRouter.post(handlerPath, handler.post);
      }
    }
    if (typeof handler.put === 'function') {
      if (typeof handler.put_mw === 'function') {
        // @ts-ignore 
        customRouter.put(handlerPath, handler.put_mw, handler.put);
      } else {
        // @ts-ignore 
        customRouter.put(handlerPath, handler.put);
      }
    }
    if (typeof handler.delete === 'function') {
      if (typeof handler.delete_mw === 'function') {
        // @ts-ignore 
        customRouter.delete(handlerPath, handler.delete_mw, handler.delete);
      } else {
        // @ts-ignore 
        customRouter.delete(handlerPath, handler.delete);
      }
    }
  })
  app
    .use(inject_sidekick)
    .use(customRouter.routes())
    .use(customRouter.allowedMethods());
  app.ws.use(inject_sidekick);
    // @ts-ignore
  app.ws.use(websocketRouter.routes());
}

async function initGraphQL() {
  let schemaNames = await query(`select schema_name from information_schema.schemata
  where schema_name not like 'pg_%' and schema_name not like 'sidekick%' 
  and schema_name not in ('information_schema', 'graphile_worker', 'postgraphile_watch');`, [])
    .then(res => res.rows.map(x => x.schema_name));

  // convert jwt cookie to Bearer Token
  app.use(jwtCookeToBearer);

  app.use(
    postgraphile(
      SIDEKICK_API_CONNECTION_STRING,
      [...schemaNames, 'sidekick'],
      Object.assign(
        {
          graphqlRoute: "/api/graphql/v1",
          eventStreamRoute: "/api/graphql/event/v1",
          subscriptions: true,
          retryOnInitFail: true,
          dynamicJson: true,
          setofFunctionsContainNulls: false,
          pgDefaultRole: "sidekick_public",
          jwtSecret: process.env.JWT_SECRET,
          jwtPgTypeIdentifier: "sidekick.jwt_token",
        },
        (process.env.ENVIRONMENT as string).toLowerCase() !== 'prod' ?
          {}
          :
          {
            graphiqlRoute: '/api/graphiql/v1',
            watchPg: true,
            graphiql: true,
            enhanceGraphiql: true,
            ownerConnectionString: SIDEKICK_ADMIN_CONNECTION_STRING,
          }
      )
    )
  )
}


/**
 * Serves static and handlebars files. Default cache 1 day unless .uncached.<ext> is includes.
 * No javascript (except for /js/ ) will be served to protect backend code.
 * @param ctx 
 */
 async function serveFromPages(ctx: CustomParameterizedContext) {
  let path:string = ctx.sidekick.dynamicMiddleware?.path || ctx.url;
  try {
    if(path.match(/^\/js.*\.\..*$/g)) {
      throw new Error("Do not allow parent path.");
    }
    else if (!(path.startsWith('/js') || path.startsWith('custom/dist/pages/js'))  && path.endsWith('.js')) {
      throw new Error("Javascript not allowed.");
    }
    return send(ctx, path,
      {
        //root: './custom/dist/pages',
        index: "index.html",
        extensions: [".html", ".css", ".htm"]
      });
  } catch (err) {
    throw Error(err);
  }
}


async function initWebServer() {
  app
    .use(mw_render_html)
    .use(dynamic_mw)
    .use(async (ctx, next) => {
      await next();
      let static_file_path = ctx.url.match(/\/admin\/.*$/g);
      if (!!static_file_path) {
        let sub_path = (static_file_path?.entries().next().value[1] as string).slice(6);
        await send(ctx, sub_path, { root: './resources/private', maxage: 1000 * 60 * 60 });
        return;
      } else {
        await serveFromPages(ctx)
          .catch(err => {
            ctx.status = 404;
            return;
          });
      }
    });
}

async function initApp({ customRouter, customMW, websocketRouter }
  : { 
    customRouter?: Router<any, {}>, customMW?: (ctx: ParameterizedContext, next: Next) => Promise<any>,
    websocketRouter?: Router<any, {}>
   },
    ) {
  if (customMW) app.use(customMW);

  else console.log('No custom middleware provided.')
  await initAdminRouter();
  app.use(catchException);
  app.use(rateLimitMW);
  await initGraphQL();
  app.use(authViaJWT);
  await initCustomRouter(customRouter, websocketRouter).catch(err => console.log(err));
  await initWebServer();
  app.listen(3000);
  await start_background_jobs();
}

let customRouter;
try {
  customRouter = require('../custom/dist/index').router;
} catch (err) {
  console.log(err)
}
let customMW;
try {
  customMW = require('../custom/dist/index').middleware;
} catch (err) {
}
initApp(
  { customRouter, customMW }
).catch(console.error)