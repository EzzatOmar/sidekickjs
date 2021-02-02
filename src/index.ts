const dotenv = require("dotenv")
dotenv.config()

import Koa, { Next, ParameterizedContext } from "koa";
import Router from "koa-router";
import send from "koa-send";
import { postgraphile } from "postgraphile";
import { adminRouter } from "./admin/index";
import { run } from "graphile-worker";
import { mw_render_html } from "./render";
import { query, getClient } from "./database/core";
import { jwtCookeToBearer } from "./middleware/cookie";
import { authViaJWT } from "./middleware/access-control";
import { rateLimitMW } from "./middleware/rate-limiter";

const SIDEKICK_API_CONNECTION_STRING = `postgres://sidekick_api:${process.env.PGUSER_API_PW}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;
const SIDEKICK_ADMIN_CONNECTION_STRING = `postgres://sidekick_admin:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;
const app = new Koa();

async function start_background_jobs() {
  // Run a worker to execute jobs:
  const runner = await run({
    connectionString: SIDEKICK_ADMIN_CONNECTION_STRING,
    concurrency: 5,
    // Install signal handlers for graceful shutdown on SIGINT, SIGTERM, etc
    noHandleSignals: false,
    pollInterval: 1000,
    // you can set the taskList or taskDirectory but not both
    // taskList: {
    //   hello: async (payload:any, helpers) => {
    //     const { name } = payload;
    //     // helpers.logger.info(`Hello, ${name}`);
    //     console.log(helpers.job.id);
    //     helpers.withPgClient(async client => {
    //       client.query("select * from sidekick.users").then(res => {
    //         console.log(res.rowCount, "HI", n);
    //       })
    //     })
    //   },
    //   error: async (payload, helpers) => {
    //     helpers.logger.error(`task ${helpers.job.id} with payload ${payload} failed! Attempt nr ${helpers.job.attempts}`);
    //     throw new Error('ERROR');
    //   }
    // },
    // or:
    taskDirectory: `${__dirname}/../custom/tasks`,
  });

  await runner.promise;
}

async function initAdminRouter() {
  app
    .use(adminRouter.routes())
    .use(adminRouter.allowedMethods());
}

async function initCustomRouter() {
  try {
    let customRouter: Router<any, {}> = require("../custom/src/router");
    app
      .use(async (ctx, next)=>{
        // include database in context
        ctx.db = {admin: {query, getClient}};
        await next();
      })
      .use(customRouter.routes())
      .use(customRouter.allowedMethods());
  } catch (err) {
    console.log(err)
  }
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
      [... schemaNames, 'sidekick'],
      {
        graphqlRoute: "/api/graphql/v1",
        graphiqlRoute: '/api/graphiql/v1',
        eventStreamRoute: "/api/graphql/event/v1",
        subscriptions: true,
        retryOnInitFail: true,
        dynamicJson: true,
        setofFunctionsContainNulls: false,
        pgDefaultRole: "sidekick_public",
        jwtSecret: process.env.JWT_SECRET,
        jwtPgTypeIdentifier: "sidekick.jwt_token",
        // dev
        watchPg: true,
        graphiql: true,
        enhanceGraphiql: true,
        ownerConnectionString: SIDEKICK_ADMIN_CONNECTION_STRING,
        // pgSettings: async (req) => {
        //   console.log(req.headers.cookie);
        //   let cookies = {};
        //   if(req.headers.cookie) {
        //     cookies = req.headers.cookie.split(';')
        //     .map(x => x.split('=',2))
        //     .reduce((r,[k,v]) => {
        //       r[k.trim()] = v;
        //       return r;
        //     }, {});
        //   }
        //   console.log(cookies.jwt);
        //   if(cookies.jwt) {
        //     req.headers.authorization = 'Bearer ' + cookies.jwt;
        //   }

        //   return {
        //     role: 'sidekick_public'
        //   };
        // }
      })
  )
}

async function initWebServer() {
  app
    .use(mw_render_html)
    .use(async (ctx, next) => {
      await next();
      let static_file_path = ctx.url.match(/\/admin\/.*$/g);
      if (!!static_file_path) {
        let sub_path = (static_file_path?.entries().next().value[1] as string).slice(6);
        await send(ctx, sub_path, { root: './resources/private', maxage: 1000 * 60 * 60 });
        return;
      } else {
        try {
          await send(ctx, ctx.url,
            {
              root: './custom/resources/public/web',
              maxage: 1000 * 60 * 60,
              index: "index.html",
              extensions: [".html", ".handlebars"]
            });
        } catch (err) {
          // returning nothing means 404 by default
        }
      }
    });
}

let customMW: ((ctx:ParameterizedContext, next:Next) => Promise<any>) | undefined;
try {
  customMW = require("../custom/src/middleware");
} catch (err) {

}

async function initApp() {
  if(customMW) app.use(customMW);
  await initAdminRouter();
  app.use(rateLimitMW);
  await initGraphQL();
  app.use(authViaJWT);
  await initCustomRouter();
  await initWebServer();
  app.listen(3000);
  await start_background_jobs();
}

initApp().catch(console.error);