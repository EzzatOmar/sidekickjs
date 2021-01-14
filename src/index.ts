const dotenv = require("dotenv")
dotenv.config()

import Koa from "koa";
import Router from "koa-router";
import send from "koa-send";
import { postgraphile } from "postgraphile";
import { adminRouter } from "./admin/index";
import { run } from "graphile-worker";
import { mw_render_html } from "./render";

const SIDEKICK_API_CONNECTION_STRING = `postgres://sidekick_api:${process.env.PGUSER_API_PW}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;
const SIDEKICK_ADMIN_CONNECTION_STRING = `postgres://sidekick_admin:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;

async function start_background_jobs(n: number) {
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

/**
 * Starting Point
 * We expect a running postgres instance and the connection information in the .env file

 */

async function init() {
  await start_background_jobs(1);
  return true;
}

init().catch(x => console.log('fail', x));

const app = new Koa();


const session = require("koa-session2");

app.use(session({
  key: "SESSIONID",   //default "koa:sess"
  path: "/admin"
}));

app
  .use(adminRouter.routes())
  .use(adminRouter.allowedMethods());

try {
  let customRouter: Router<any, {}> = require("../custom/src/router");
  app
    .use(customRouter.routes())
    .use(customRouter.allowedMethods());
} catch (err) {
  console.log(err)
}

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
      await send(ctx, ctx.url,
        {
          root: './custom/resources/public/web',
          maxage: 1000 * 60 * 60,
          index: "index.html",
          extensions: [".html"]
        });
    }
  });



app.use(
  postgraphile(
    SIDEKICK_API_CONNECTION_STRING,
    ['sidekick'],
    {
      graphqlRoute: "/api/graphql/v1",
      graphiqlRoute: '/api/graphiql/v1',
      eventStreamRoute: "/api/graphql/event/v1",
      subscriptions: true,
      retryOnInitFail: true,
      dynamicJson: true,
      setofFunctionsContainNulls: false,
      pgDefaultRole: "sidekick_public",
      jwtSecret: "SECRET_FOR_JWT",
      jwtPgTypeIdentifier: "sidekick.jwt_token",
      // dev
      watchPg: true,
      graphiql: true,
      enhanceGraphiql: true,
      ownerConnectionString: SIDEKICK_ADMIN_CONNECTION_STRING
    })
)

app.listen(3000);
