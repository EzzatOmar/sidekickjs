const dotenv = require("dotenv")
dotenv.config()

import Koa from "koa";
import Router from "koa-router";
import pg from "pg";
import { Map } from "immutable";
import {query, getClient} from "./database/core";
import {initialize_tables} from "./database/init";

getClient().then(client => {
  // client.query("SELECT 1")
  // console.log(client)
  initialize_tables(client).then(console.log)

})


/**
 * Starting Point
 * We expect a running postgres instance and the connection information in the .env file
 * 
 * First the database will be initialize
 *  Reading all yaml files in src/database/tabes
 * 
 * 
 */
const app = new Koa();
const router = new Router();

router.get("/", (ctx:Koa.ParameterizedContext, next) => {
  ctx.body = "HELLO";
  
  
})

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3000);
