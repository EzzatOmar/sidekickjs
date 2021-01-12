const dotenv = require("dotenv")
dotenv.config()

import Koa from "koa";
import Router from "koa-router";
import send from "koa-send";
import pg from "pg";
import { Map } from "immutable";
import {query, getClient} from "./database/core";
import {initialize_tables} from "./database/init";
import {initialize_extensions} from "./init_extensions";
import {init_roles} from "./roles/init";
import {getFileFromDir} from "./utils/files";
import {readFileSync} from "fs";
import { postgraphile } from "postgraphile";
import {adminRouter} from "./admin/index";

/**
 * Starting Point
 * We expect a running postgres instance and the connection information in the .env file

 */

async function init(){

}

init();

const app = new Koa();
const router = new Router();


let sidekick_api_database_url = `postgres://sidekick_api:${process.env.PGUSER_API_PW}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;
let sidekick_admin_database_url = `postgres://sidekick_admin:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;

app.use(
  postgraphile(
    sidekick_api_database_url, 
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
      ownerConnectionString: sidekick_admin_database_url
    })
)


const session = require("koa-session2");

app.use(session({
    key: "SESSIONID",   //default "koa:sess"
    path: "/admin"
}));

app
  .use(adminRouter.routes())
  .use(adminRouter.allowedMethods())
  .use(router.routes())
  .use(router.allowedMethods())
  .use(async (ctx, next) => {
    await next();
    let static_file_path = ctx.url.match(/\/admin\/.*$/g);
    if(!!static_file_path){
      let sub_path = (static_file_path?.entries().next().value[1] as string).slice(6);
      await send(ctx, sub_path, {root: './resources/public', maxage: 1000 * 60 * 60});
    }
  });
  
app.listen(3000);
