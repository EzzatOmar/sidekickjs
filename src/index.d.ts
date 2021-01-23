import {ParameterizedContext} from "koa";
import {PoolClient, QueryResult} from "pg";

export interface CustonParameterizedContext extends ParameterizedContext {
  db: {
    admin: {
      query: Promise<QueryResult>,
      getClient: Promise<PoolClient & {lastQuery?: any[]}>
    }
  }
}