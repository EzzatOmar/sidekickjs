# Sidekick.js
A modern opinionated web backend for rapid prototyping.  
Sidekick provides Routing, GraphQL, RestAPI and JWT-Authorization out of the box.

Sidekick takes the database driven development approch.  
The goal is to move as much business logic into the database (including authentication).  
Background workers can execute async javascript code directly from the database.  

HTML are executed directly as handlebars partials or been served by custom routes using Koajs.

Just put your custom code in ./custom/dist and your web server is ready to go.

Sidekick works on top of other open source projects.
- [Postrest](https://www.postgresql.org/) as the database
- [Postgraphile](https://github.com/graphile/postgraphile) generates GraphQL from the database
- [PostgREST](https://github.com/PostgREST/postgrest) generates a REST-API from the database
- [graphile-worker](https://github.com/graphile/worker/) provides async background functions executed by Postgres
- [Koa](https://github.com/koajs/koa/) expressive HTTP middleware framework for node.js.

Sidekick is in early development. The API might change in the future.
