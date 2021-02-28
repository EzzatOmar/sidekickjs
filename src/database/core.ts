import {Pool, PoolClient, QueryResult} from "pg";

// Uses the env vars to initialize database connection
const pool = new Pool();

export async function query(text: string, params:any = []):Promise<QueryResult> {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  // console.log('executed query', { text, duration, rows: res.rowCount });
  return res
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