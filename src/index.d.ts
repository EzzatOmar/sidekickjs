import { ParameterizedContext } from "koa";
import { Pool, PoolClient, QueryResult } from "pg";

type Query = (text: string, params: any) => Promise<QueryResult>;
type ClientFn = () => Promise<PoolClient & { lastQuery?: any[] }>;


export interface CustomParameterizedContext extends ParameterizedContext {
  sidekick: {
    db: {
      admin: {
        query: Query,
        getClient: ClientFn,
      }
    },
    view: {
      jwt?: {
        user_uuid: string,
        role: string,
        exp: number,
        aud: string,
        iat: number
      },
      prod: boolean,
      staging: boolean,
      local: boolean,
      protocol: string,
      domain: string
    },
    render: (path: string, view: any) => string,
    genJWT: (user_uuid: string, role: string, exp?: number, payload?: any) => string
  }
}