import {Pool, PoolClient, QueryResult} from "pg";
// @ts-ignore
import Client from "pg-native";

// Uses the env vars to initialize database connection
const SIDEKICK_API_CONNECTION_STRING = `postgres://sidekick_api:${process.env.PGUSER_API_PW}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;
const pool = new Pool({
  connectionString: SIDEKICK_API_CONNECTION_STRING
});

var client = new Client()
client.connectSync(SIDEKICK_API_CONNECTION_STRING);

function jwtToAuthStmt(jwt:any):string[] {
  if(jwt) {
    let stmt = [`SET LOCAL role TO ${jwt.role};`];
    Object.keys(jwt).forEach(key => {
      stmt.push(`SET LOCAL jwt.claims.${key} TO '${jwt[key]}';`);
    })
    return stmt;
  } else {
    return ["SET LOCAL role TO 'sidekick_public';"];
  }
}

export function syncQuery(jwt: any, text:string, params:any = []):any[] {
  client.querySync('BEGIN;');
  let stmts = jwtToAuthStmt(jwt);
  stmts.forEach(stmt => client.querySync(stmt));
  var x = client.querySync(text, params);
  client.querySync('COMMIT;');
  return x;
}

export async function query(jwt: any, text: string, params:any = []):Promise<QueryResult> {
  
  // const start = Date.now();
  const res = await pool.query(jwtToAuthStmt(jwt) + text, params);
  // const duration = Date.now() - start;
  // console.log('executed query', { text, duration, rows: res.rowCount });
  return res
}

// export async function getClient():Promise<PoolClient & {lastQuery?: any[]}> {
//   const client: PoolClient & {lastQuery?: any[]} = await pool.connect();
//   const query = client.query;
//   const release = client.release;
//   // set a timeout of 5 seconds, after which we will log this client's last query
//   const timeout = setTimeout(() => {
//     console.error('A client has been checked out for more than 5 seconds!')
//     console.error(`The last executed query on this client was: ${client.lastQuery}`)
//   }, 5000);
//   // monkey patch the query method to keep track of the last query executed
//   // @ts-ignore
//   client.query = (...args:any[]) => {
//     client.lastQuery = args
//     // @ts-ignore
//     return query.apply(client, args)
//   }
//   client.release = () => {
//     // clear our timeout
//     clearTimeout(timeout)
//     // set the methods back to their old un-monkey-patched version
//     client.query = query
//     client.release = release
//     return release.apply(client)
//   }
//   return client
// }