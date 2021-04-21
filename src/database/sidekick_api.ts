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

/**
 * Takes a parsed jwt object and returns an array of sql statements for rls.
 * Sets the role to jwt.role. Sets the claims to jwt.claims.<key>.
 */
export function jwtToAuthStmt(jwt?:any):string[] {
  if(jwt) {
    let stmt = [`SET LOCAL role TO ${jwt.role || 'sidekick_public'};`];
    Object.keys(jwt).forEach(key => {
      stmt.push(`SET LOCAL jwt.claims.${key} TO '${jwt[key]}';`);
    });
    return stmt;
  } else {
    return ["SET LOCAL role TO 'sidekick_public';"];
  }
}

// export function syncQueryReadOnly(jwt: any, text:string, params:any = []):any[] {
//   client.querySync('BEGIN TRANSACTION ISOLATION LEVEL READ ONLY;');
//   let stmts = jwtToAuthStmt(jwt);
//   stmts.forEach(stmt => client.querySync(stmt));
//   var x = client.querySync(text, params);
//   client.querySync('COMMIT;');
//   return x;
// }


// export async function query(jwt: any, text: string, params:any = []):Promise<QueryResult> {
//   const res = await pool.query(jwtToAuthStmt(jwt) + text, params);
//   return res;
// }

/**
 * Executes a single transaction. If a jwt parsed object is passed then the role and claims will be set automatically.
 * Releases the connection when done.
 */
export async function tx(jwt: any, stmt: string, params: any[] = []):Promise<QueryResult> {
  const client: PoolClient & {lastQuery?: any[]} = await pool.connect();
  let ret;
  try {
    await client.query('BEGIN');
    jwtToAuthStmt(jwt).forEach(async stmt => await client.query(stmt));
    ret = await client.query(stmt, params);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  return ret;

}

/**
 * Executes a multiple statements in a single transaction. If a jwt parsed object is passed then the role and claims will be set automatically.
 * Releases the connection when done.
 */
export async function txs(jwt: any, stmts: {stmt: string, params: any[]}[]):Promise<QueryResult[]> {
  const client: PoolClient & {lastQuery?: any[]} = await pool.connect();
  let ret = [];
  try {
    await client.query('BEGIN');
    jwtToAuthStmt(jwt).forEach(async stmt => await client.query(stmt));
    for (const {stmt, params} of stmts){
      let r = await client.query(stmt, params);
      ret.push(r);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  return ret;
}

/**
 * Executes a async fn in a single transaction. The fn should execute the a statement. If a jwt parsed object is passed then the role and claims will be set automatically.
 * Releases the connection when done.
 */
export async function txFn(jwt: any, fn: (client: PoolClient) => Promise<any>):Promise<any> {
  const client: PoolClient & {lastQuery?: any[]} = await pool.connect();
  let ret;
  try {
    await client.query('BEGIN');
    jwtToAuthStmt(jwt).forEach(async stmt => await client.query(stmt));
    ret = await fn(client);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  return ret;
}


export async function getClient():Promise<PoolClient & {lastQuery?: any[]}> {
  const client: PoolClient & {lastQuery?: any[]} = await pool.connect();
  const query = client.query;
  const release = client.release;
  // set a timeout of 5 seconds, after which we will log this client's last query
  const timeout = setTimeout(() => {
    console.error('A client has been checked out for more than 5 seconds!')
    console.error(`The last executed query on this client was: ${client.lastQuery}`)
  }, 5000);
  // monkey patch the query method to keep track of the last query executed
  // @ts-ignore
  client.query = (...args:any[]) => {
    client.lastQuery = args
    // @ts-ignore
    return query.apply(client, args)
  }
  client.release = () => {
    // clear our timeout
    clearTimeout(timeout)
    // set the methods back to their old un-monkey-patched version
    client.query = query
    client.release = release
    return release.apply(client)
  }
  return client
}