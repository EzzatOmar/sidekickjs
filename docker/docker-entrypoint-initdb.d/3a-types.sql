-- CREATE TYPES

CREATE TYPE sidekick.jwt_token AS
(
  role text COLLATE pg_catalog."default",
  user_id integer,
  exp bigint
);
-- ddl-end --
ALTER TYPE sidekick.jwt_token OWNER TO sidekick_admin;