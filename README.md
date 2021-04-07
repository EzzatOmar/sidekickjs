# Sidekick.js
A modern opinionated web backend for rapid prototyping.  
Sidekick provides Routing, GraphQL, RestAPI and JWT-Authorization out of the box.

Sidekick takes the database driven development approch.  
The goal is to move as much business logic into the database (including authentication).  
Background workers can execute async javascript code directly from the database.  

HTML are executed directly as handlebars partials or been served by custom routes using Koajs.

Just put your custom code in ./custom/dist and your web server is ready to go.

Sidekick works on top of other open source projects.
- [PostgreSQL](https://www.postgresql.org/) as the database
- [Postgraphile](https://github.com/graphile/postgraphile) generates GraphQL from the database
- [PostgREST](https://github.com/PostgREST/postgrest) generates a REST-API from the database
- [graphile-worker](https://github.com/graphile/worker/) provides async background functions executed by Postgres
- [Koa](https://github.com/koajs/koa/) expressive HTTP middleware framework for node.js.

Sidekick is in early development. The API might change in the future.

---

## Getting Started  
### Prerequisite  
- Install latest node & npm
- Install docker & docker-compose
- Needs pg_config on your path [https://github.com/brianc/node-pg-native#install]


```bash
npm i
```

```bash
npm run compile
```

``` bash
npm run tw-prod
```

```bash
cp _.env .env
```

Create a static index.html file in custom/dist/pages


```bash
docker create network sidekick
```

```bash
docker-compose  up -d
```

Posgres needs to finsh initialization on the first run. The web server will connect afterwards.

Now you should be ready to open [localhost:3000](http://localhost:3000/)

You will find a custom project in ./custom/dist/ .
The web pages are in pages.
The structure in pages follows the web path structure. You can overwrite the default handler or middlware by creating a handler.js file and exporting a koa.js function as get, get_middleware, post, post_middleware ...

The admin dashboard can be found with [localhost:3000/admin](https://localhost:3000/admin).

