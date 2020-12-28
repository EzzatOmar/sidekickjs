const dotenv = require("dotenv")
dotenv.config()

import Koa from "koa";
import Router from "koa-router";
import pg from "pg";
import { Map } from "immutable";
import {query, getClient} from "./database/core";
import {initialize_tables} from "./database/init";
import {initialize_extensions} from "./init_extensions";
import {init_roles} from "./roles/init";

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
    client.query(`ALTER ROLE sidekick_api WITH LOGIN PASSWORD '${process.env.PGUSER_API_PW || "DEFAULT_PW"}';`, [])
  });

  await getClient()
  .then(initialize_tables)
  .then(_ => console.log("Init default tables completed."));
  
  await getClient().then(client => {
    initialize_extensions(client)
  }).then(_ => console.log("Init extensions completed"));

  await getClient().then(client => {
    init_roles(client)
  }).then(_ => console.log("Init default roles completed"));

}

init();

const app = new Koa();
const router = new Router();

router.get("/", (ctx:Koa.ParameterizedContext, next) => {
  ctx.body = "HELLO";
  
  
})

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3000);
