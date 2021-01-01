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
 * 
 * First the database will be initialize
 *  Reading all yaml files in src/database/tabes
 * 
 * Initialize all extensions
 */

async function init(){
  await getClient()
  .then(client => {
    try {
      client.query(`ALTER ROLE sidekick_api WITH LOGIN PASSWORD '${process.env.PGUSER_API_PW || "DEFAULT_PW"}';`, [])
    } catch (err) {
      console.log(err); 
    } finally {
      client.release();
    }
  });

  await getClient()
  .then(initialize_tables)
  .then(_ => console.log("Init default tables completed."));
  
  
  await getClient().then(client => {
    init_roles(client)
  }).then(_ => console.log("Init default roles completed"));

  await getClient().then(async client => {
    let sql_files = getFileFromDir('./src/database/sql', [], ".sql")
                    .sort()
                    .map(filename => readFileSync(filename, "utf8"));
    for(let i = 0; i < sql_files.length; i++) {
      await client.query(sql_files[i], []);
    }
    client.release();
  });
  
  await getClient().then(client => {
    initialize_extensions(client)
  }).then(_ => console.log("Init extensions completed"));
}

init();

const app = new Koa();
const router = new Router();

// @ts-ignore
router.get("/", (ctx, next) => {console.log(ctx.session); next();}, (ctx:Koa.ParameterizedContext, next) => {
  ctx.body = "HELLO";
})


let sidekick_api_database_url = `postgres://sidekick_api:${process.env.PGUSER_API_PW}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;
let sidekick_admin_database_url = `postgres://sidekick_admin:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;

getClient().then(client => {
  let r = client.query(`select namespace from sidekick.extensions;`).then(res => res.rows.map(r => r.namespace));
  client.release();
  return r;
}).then(schema => {
  app.use(
    postgraphile(
      sidekick_api_database_url, 
      [...schema,'sidekick'], 
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
}).catch(err => console.log(`Could not initialize graphql endpoint.`, err));

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
  .use(async (ctx) => {
    let static_file_path = ctx.url.match(/\/admin\/.*$/g);
    if(!!static_file_path){
      let sub_path = (static_file_path?.entries().next().value[1] as string).slice(6);
      await send(ctx, sub_path, {root: './resources/public'});
    }
  });
  
app.listen(3000);
