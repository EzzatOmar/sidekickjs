-- NOTE: the code below contains the SQL for the selected object
-- as well for its dependencies and children (if applicable).
-- 
-- This feature is only a convinience in order to permit you to test
-- the whole object's SQL definition at once.
-- 
-- When exporting or generating the SQL for the whole database model
-- all objects will be placed at their original positions.


-- object: sidekick | type: SCHEMA --
-- DROP SCHEMA IF EXISTS sidekick CASCADE;
CREATE SCHEMA sidekick;
-- ddl-end --
ALTER SCHEMA sidekick OWNER TO sidekick_admin;
-- ddl-end --
COMMENT ON SCHEMA sidekick IS E'Tables and views should not be visible from the outside.';
-- ddl-end --

-- object: sidekick.updated_at_trigger | type: FUNCTION --
-- DROP FUNCTION IF EXISTS sidekick.updated_at_trigger() CASCADE;
CREATE FUNCTION sidekick.updated_at_trigger ()
	RETURNS trigger
	LANGUAGE plpgsql
	VOLATILE 
	CALLED ON NULL INPUT
	SECURITY INVOKER
	COST 100
	AS $$
  BEGIN
      NEW.updated_at = now();
      RETURN NEW;
  END;
  
$$;
-- ddl-end --
ALTER FUNCTION sidekick.updated_at_trigger() OWNER TO sidekick_admin;
-- ddl-end --

-- object: sidekick.extensions | type: TABLE --
-- DROP TABLE IF EXISTS sidekick.extensions CASCADE;
CREATE TABLE sidekick.extensions (
	namespace text NOT NULL,
	created_at timestamp with time zone NOT NULL DEFAULT now(),
	updated_at timestamp with time zone NOT NULL DEFAULT now(),
	version text NOT NULL,
	url text,
	doc text,
	state json,
	CONSTRAINT extensions_namespace_check CHECK ((namespace = lower(namespace))),
	CONSTRAINT extensions_pkey PRIMARY KEY (namespace)

);
-- ddl-end --
COMMENT ON TABLE sidekick.extensions IS E'Stores all the extensions read from the yaml files. Also keeps state as JSON for each extension. The json state should usually only be written by the extension.';
-- ddl-end --
COMMENT ON COLUMN sidekick.extensions.namespace IS E'Lower case text, primary key, must be unique';
-- ddl-end --
COMMENT ON COLUMN sidekick.extensions.created_at IS E'Timestamp when the user was created';
-- ddl-end --
COMMENT ON COLUMN sidekick.extensions.updated_at IS E'Timestamp when the last modification has happend';
-- ddl-end --
COMMENT ON COLUMN sidekick.extensions.version IS E'e.g. 1.0.0';
-- ddl-end --
COMMENT ON COLUMN sidekick.extensions.url IS E'Optional. Webpage for more information if available';
-- ddl-end --
COMMENT ON COLUMN sidekick.extensions.doc IS E'Optional. Documentation as text.';
-- ddl-end --
COMMENT ON COLUMN sidekick.extensions.state IS E'JSON object. Is set to the state key in the yaml file on creating this row. Updating the state key in the YAML file will not trigger updates.';
-- ddl-end --
ALTER TABLE sidekick.extensions OWNER TO sidekick_admin;
-- ddl-end --

-- object: sidekick.users_id_seq | type: SEQUENCE --
-- DROP SEQUENCE IF EXISTS sidekick.users_id_seq CASCADE;
CREATE SEQUENCE sidekick.users_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START WITH 1
	CACHE 1
	NO CYCLE
	OWNED BY NONE;

-- ddl-end --
ALTER SEQUENCE sidekick.users_id_seq OWNER TO sidekick_admin;
-- ddl-end --

-- object: sidekick.users | type: TABLE --
-- DROP TABLE IF EXISTS sidekick.users CASCADE;
CREATE TABLE sidekick.users (
	id integer NOT NULL DEFAULT nextval('sidekick.users_id_seq'::regclass),
	created_at timestamp with time zone NOT NULL DEFAULT now(),
	updated_at timestamp with time zone NOT NULL DEFAULT now(),
	blocked boolean NOT NULL DEFAULT false,
	CONSTRAINT users_pkey PRIMARY KEY (id)

);
-- ddl-end --
COMMENT ON TABLE sidekick.users IS E'Base User Identity. If the user is **blocked** no REST or GraphQL actions can be performed.   User concept will be extended by other tables. Usually going by the nameing convention users__<decoration> with references via users__id';
-- ddl-end --
COMMENT ON COLUMN sidekick.users.id IS E'Auto incremental integer';
-- ddl-end --
COMMENT ON COLUMN sidekick.users.created_at IS E'Timestamp when the user was created';
-- ddl-end --
COMMENT ON COLUMN sidekick.users.updated_at IS E'Timestamp when the last modification has happend';
-- ddl-end --
COMMENT ON COLUMN sidekick.users.blocked IS E'Boolean';
-- ddl-end --
ALTER TABLE sidekick.users OWNER TO sidekick_admin;
-- ddl-end --
ALTER TABLE sidekick.users ENABLE ROW LEVEL SECURITY;
-- ddl-end --

-- object: sidekick.global_id_seq | type: SEQUENCE --
-- DROP SEQUENCE IF EXISTS sidekick.global_id_seq CASCADE;
CREATE SEQUENCE sidekick.global_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START WITH 1
	CACHE 1
	NO CYCLE
	OWNED BY NONE;

-- ddl-end --
ALTER SEQUENCE sidekick.global_id_seq OWNER TO sidekick_admin;
-- ddl-end --

-- object: sidekick.global | type: TABLE --
-- DROP TABLE IF EXISTS sidekick.global CASCADE;
CREATE TABLE sidekick.global (
	id integer NOT NULL DEFAULT nextval('sidekick.global_id_seq'::regclass),
	created_at timestamp with time zone NOT NULL DEFAULT now(),
	updated_at timestamp with time zone NOT NULL DEFAULT now(),
	user_uuid UUID,
	key text NOT NULL,
	val_bool boolean,
	val_text text,
	val_int integer,
	CONSTRAINT val_not_null CHECK (((val_bool IS NOT NULL) OR (val_text IS NOT NULL) OR (val_int IS NOT NULL))),
	CONSTRAINT global_pkey PRIMARY KEY (id),
	CONSTRAINT global_key_key UNIQUE (key)

);
-- ddl-end --
COMMENT ON TABLE sidekick.global IS E'Stores global state in the database. Value must be bool, text or int.';
-- ddl-end --
COMMENT ON COLUMN sidekick.global.id IS E'Auto incremental integer';
-- ddl-end --
COMMENT ON COLUMN sidekick.global.created_at IS E'Timestamp when the user was created';
-- ddl-end --
COMMENT ON COLUMN sidekick.global.updated_at IS E'Timestamp when the last modification has happend';
-- ddl-end --
COMMENT ON COLUMN sidekick.global.users__id IS E'Reference id from the users table';
-- ddl-end --
COMMENT ON COLUMN sidekick.global.key IS E'Unique key to get value';
-- ddl-end --
COMMENT ON COLUMN sidekick.global.val_bool IS E'Boolean, true or false';
-- ddl-end --
COMMENT ON COLUMN sidekick.global.val_text IS E'Text';
-- ddl-end --
COMMENT ON COLUMN sidekick.global.val_int IS E'Integer';
-- ddl-end --
ALTER TABLE sidekick.global OWNER TO sidekick_admin;
-- ddl-end --

-- object: global_users__id_fkey_idx | type: INDEX --
-- DROP INDEX IF EXISTS sidekick.global_users__id_fkey_idx CASCADE;
CREATE INDEX global_users__id_fkey_idx ON sidekick.global
	USING btree
	(
	  users__id pg_catalog.int4_ops
	)
	WITH (FILLFACTOR = 90);
-- ddl-end --

-- object: sidekick.routes_id_seq | type: SEQUENCE --
-- DROP SEQUENCE IF EXISTS sidekick.routes_id_seq CASCADE;
CREATE SEQUENCE sidekick.routes_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START WITH 1
	CACHE 1
	NO CYCLE
	OWNED BY NONE;

-- ddl-end --
ALTER SEQUENCE sidekick.routes_id_seq OWNER TO sidekick_admin;
-- ddl-end --

-- object: sidekick.routes | type: TABLE --
-- DROP TABLE IF EXISTS sidekick.routes CASCADE;
CREATE TABLE sidekick.routes (
	id integer NOT NULL DEFAULT nextval('sidekick.routes_id_seq'::regclass),
	created_at timestamp with time zone NOT NULL DEFAULT now(),
	updated_at timestamp with time zone NOT NULL DEFAULT now(),
	name text NOT NULL,
	route text NOT NULL,
	method text NOT NULL,
	handler text NOT NULL,
	middleware text NOT NULL,
	namespace text NOT NULL,
	active boolean NOT NULL DEFAULT false,
	admin_route boolean NOT NULL DEFAULT false,
	priority integer,
	description text NOT NULL,
	CONSTRAINT routes_name_check CHECK ((name = lower(name))),
	CONSTRAINT routes_route_check CHECK ((route ~* '^/.*'::text)),
	CONSTRAINT routes_method_check CHECK ((method = ANY (ARRAY['GET'::text, 'POST'::text, 'PUT'::text, 'DELETE'::text, 'PATCH'::text, 'OPTIONS'::text, 'HEAD'::text, 'CONNECT'::text, 'TRACE'::text]))),
	CONSTRAINT routes_handler_check CHECK ((handler ~* '^[^.]+\.[^.]+$'::text)),
	CONSTRAINT routes_middleware_check CHECK ((middleware ~* '^[^.]+\.[^.]+$'::text)),
	CONSTRAINT routes_namespace_check CHECK ((char_length(namespace) > 0)),
	CONSTRAINT routes_pkey PRIMARY KEY (id),
	CONSTRAINT routes_route_method_key UNIQUE (route,method)

);
-- ddl-end --
COMMENT ON TABLE sidekick.routes IS E'Each route will be saved here. Route, method tuple must be unique.';
-- ddl-end --
COMMENT ON COLUMN sidekick.routes.id IS E'Auto incremental integer';
-- ddl-end --
COMMENT ON COLUMN sidekick.routes.created_at IS E'Timestamp when the user was created';
-- ddl-end --
COMMENT ON COLUMN sidekick.routes.updated_at IS E'Timestamp when the last modification has happend';
-- ddl-end --
COMMENT ON COLUMN sidekick.routes.name IS E'Only for description purpose';
-- ddl-end --
COMMENT ON COLUMN sidekick.routes.method IS E'Must be one of (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD, CONNECT, TRACE)';
-- ddl-end --
COMMENT ON COLUMN sidekick.routes.handler IS E'Must be in from of schema.function_name. The Schema is the same as the namespace.';
-- ddl-end --
ALTER TABLE sidekick.routes OWNER TO sidekick_admin;
-- ddl-end --

------- BEGIN sidekick_private schema
-- NOTE: the code below contains the SQL for the selected object
-- as well for its dependencies and children (if applicable).
-- 
-- This feature is only a convinience in order to permit you to test
-- the whole object's SQL definition at once.
-- 
-- When exporting or generating the SQL for the whole database model
-- all objects will be placed at their original positions.


-- object: sidekick_private | type: SCHEMA --
-- DROP SCHEMA IF EXISTS sidekick_private CASCADE;
CREATE SCHEMA sidekick_private;
-- ddl-end --
ALTER SCHEMA sidekick_private OWNER TO sidekick_admin;
-- ddl-end --
COMMENT ON SCHEMA sidekick_private IS E'Tables and views must not be visible or accessible from any user except sidekick_admin. Only function with the securiy definer are allowed to be executed outside the sidekick_admin role.';
-- ddl-end --

-- object: sidekick_private.updated_at_trigger | type: FUNCTION --
-- DROP FUNCTION IF EXISTS sidekick_private.updated_at_trigger() CASCADE;
CREATE FUNCTION sidekick_private.updated_at_trigger ()
	RETURNS trigger
	LANGUAGE plpgsql
	VOLATILE 
	CALLED ON NULL INPUT
	SECURITY INVOKER
	COST 100
	AS $$
  BEGIN
      NEW.updated_at = now();
      RETURN NEW;
  END;
  
$$;
-- ddl-end --
ALTER FUNCTION sidekick_private.updated_at_trigger() OWNER TO sidekick_admin;
-- ddl-end --

-- object: sidekick_private.users_password | type: TABLE --
-- DROP TABLE IF EXISTS sidekick_private.users_password CASCADE;
CREATE TABLE sidekick_private.users_password (
	id integer NOT NULL,
	created_at timestamp with time zone NOT NULL DEFAULT now(),
	updated_at timestamp with time zone NOT NULL DEFAULT now(),
	password_hash character(60),
	password_recovery_code uuid,
	password_recovery_code_updated_at timestamp,
	CONSTRAINT users_password_pkey PRIMARY KEY (id)

);
-- ddl-end --
COMMENT ON TABLE sidekick_private.users_password IS E'Extends the base user table by the concept of passwords. Each password is stored as a hash and can have a recovery code. It is possible to have multiple passwords per user.';
-- ddl-end --
COMMENT ON COLUMN sidekick_private.users_password.id IS E'Auto incremental integer';
-- ddl-end --
COMMENT ON COLUMN sidekick_private.users_password.created_at IS E'Timestamp when the user was created';
-- ddl-end --
COMMENT ON COLUMN sidekick_private.users_password.updated_at IS E'Timestamp when the last modification has happend';
-- ddl-end --
COMMENT ON COLUMN sidekick_private.users_password.password_hash IS E'Hash value 60 character in length';
-- ddl-end --
COMMENT ON COLUMN sidekick_private.users_password.password_recovery_code IS E'An uuid which will should always be null unless a recovery has been issued';
-- ddl-end --
COMMENT ON COLUMN sidekick_private.users_password.password_recovery_code_updated_at IS E'Timestamp when the recovery uuid was last updated';
-- ddl-end --
ALTER TABLE sidekick_private.users_password OWNER TO sidekick_admin;
-- ddl-end --

-- object: update_users_password_updated_at | type: TRIGGER --
-- DROP TRIGGER IF EXISTS update_users_password_updated_at ON sidekick_private.users_password CASCADE;
CREATE TRIGGER update_users_password_updated_at
	BEFORE UPDATE
	ON sidekick_private.users_password
	FOR EACH ROW
	EXECUTE PROCEDURE sidekick_private.updated_at_trigger('');
-- ddl-end --

-- object: users_password_id_fkey | type: CONSTRAINT --
-- ALTER TABLE sidekick_private.users_password DROP CONSTRAINT IF EXISTS users_password_id_fkey CASCADE;
ALTER TABLE sidekick_private.users_password ADD CONSTRAINT users_password_id_fkey FOREIGN KEY (id)
REFERENCES sidekick.users (id) MATCH SIMPLE
ON DELETE CASCADE ON UPDATE NO ACTION;
-- ddl-end --

------- END sidekick_private schema

-- object: sidekick.register_user_by_password | type: FUNCTION --
-- DROP FUNCTION IF EXISTS sidekick.register_user_by_password(boolean,text) CASCADE;
CREATE FUNCTION sidekick.register_user_by_password (blocked boolean, password text)
	RETURNS sidekick.users
	LANGUAGE plpgsql
	VOLATILE 
	STRICT
	SECURITY DEFINER
	COST 100
	AS $$
 declare new_user sidekick.users; begin insert into sidekick.users (blocked) values (blocked) returning * into new_user;
insert into sidekick_private.users_password (id, password_hash) values (new_user.id, crypt(password, gen_salt('bf')));
return new_user; end; 
$$;
-- ddl-end --
ALTER FUNCTION sidekick.register_user_by_password(boolean,text) OWNER TO sidekick_admin;
-- ddl-end --
COMMENT ON FUNCTION sidekick.register_user_by_password(boolean,text) IS E'Registers a single user by password and returns a sidekick.users. First argument is a boolean telling if the user should be marked as blocked. The Secound argurmen it the password in plain text. The password will be hashed using the pg function crypt(password, gen_salt("bf"))';
-- ddl-end --

-- object: sidekick.jwt_token | type: TYPE --
-- DROP TYPE IF EXISTS sidekick.jwt_token CASCADE;
CREATE TYPE sidekick.jwt_token AS
(
  role text COLLATE pg_catalog."default",
  user_id integer,
  exp bigint
);
-- ddl-end --
ALTER TYPE sidekick.jwt_token OWNER TO sidekick_admin;
-- ddl-end --

-- object: sidekick.users_decoration | type: TABLE --
-- DROP TABLE IF EXISTS sidekick.users_decoration CASCADE;
CREATE TABLE sidekick.users_decoration (
	id integer NOT NULL,
	created_at timestamp with time zone NOT NULL DEFAULT now(),
	updated_at timestamp with time zone NOT NULL DEFAULT now(),
	username text,
	email text,
	CONSTRAINT users_decoration_username_check CHECK ((char_length(username) >= 3)),
	CONSTRAINT users_decoration_email_check CHECK ((email ~* '^.+@.+\..+$'::text)),
	CONSTRAINT users_decoration_pkey PRIMARY KEY (id),
	CONSTRAINT users_decoration_username_key UNIQUE (username),
	CONSTRAINT users_decoration_email_key UNIQUE (email)

);
-- ddl-end --
COMMENT ON TABLE sidekick.users_decoration IS E'Extends the base User Identity. Introduces username and email';
-- ddl-end --
COMMENT ON COLUMN sidekick.users_decoration.id IS E'Auto incremental integer';
-- ddl-end --
COMMENT ON COLUMN sidekick.users_decoration.created_at IS E'Timestamp when the user was created';
-- ddl-end --
COMMENT ON COLUMN sidekick.users_decoration.updated_at IS E'Timestamp when the last modification has happend';
-- ddl-end --
COMMENT ON COLUMN sidekick.users_decoration.username IS E'Text must be at least 6 characters long';
-- ddl-end --
COMMENT ON COLUMN sidekick.users_decoration.email IS E'Text must include a single @ symbol';
-- ddl-end --
ALTER TABLE sidekick.users_decoration OWNER TO sidekick_admin;
-- ddl-end --
ALTER TABLE sidekick.users_decoration ENABLE ROW LEVEL SECURITY;
-- ddl-end --

-- object: users_decoration_id_fkey_idx | type: INDEX --
-- DROP INDEX IF EXISTS sidekick.users_decoration_id_fkey_idx CASCADE;
CREATE INDEX users_decoration_id_fkey_idx ON sidekick.users_decoration
	USING btree
	(
	  id pg_catalog.int4_ops
	)
	WITH (FILLFACTOR = 90);
-- ddl-end --

-- object: sidekick.authenticate_user_by_email_password | type: FUNCTION --
-- DROP FUNCTION IF EXISTS sidekick.authenticate_user_by_email_password(text,text) CASCADE;
CREATE FUNCTION sidekick.authenticate_user_by_email_password (email text, password text)
	RETURNS sidekick.jwt_token
	LANGUAGE plpgsql
	VOLATILE 
	STRICT
	SECURITY DEFINER
	COST 100
	AS $$
declare
  auth_user sidekick_private.users_password;
begin
  select up.* into auth_user
  from sidekick.users_decoration ud
  inner join sidekick_private.users_password up on ud.id = up.id
  where ud.email = $1 AND ud.email is not null;

  if auth_user.password_hash = crypt(password, auth_user.password_hash) then
    return ('sidekick_user', auth_user.id, extract(epoch from (now() + interval '2 days')))::sidekick.jwt_token;
  else
    return null;
  end if;
end;
$$;
-- ddl-end --
ALTER FUNCTION sidekick.authenticate_user_by_email_password(text,text) OWNER TO sidekick_admin;
-- ddl-end --
COMMENT ON FUNCTION sidekick.authenticate_user_by_email_password(text,text) IS E'Creates a JWT token that will securely identify an user and give them certain permissions. This token expires in 2 days.';
-- ddl-end --

-- object: sidekick.authenticate_user_by_username_password | type: FUNCTION --
-- DROP FUNCTION IF EXISTS sidekick.authenticate_user_by_username_password(text,text) CASCADE;
CREATE FUNCTION sidekick.authenticate_user_by_username_password (username text, password text)
	RETURNS sidekick.jwt_token
	LANGUAGE plpgsql
	VOLATILE 
	STRICT
	SECURITY DEFINER
	COST 100
	AS $$
declare
  auth_user sidekick_private.users_password;
begin
  select up.* into auth_user
  from sidekick.users_decoration ud
  inner join sidekick_private.users_password up on ud.id = up.id
  where ud.username = $1 AND ud.username is not null;

  if auth_user.password_hash = crypt(password, auth_user.password_hash) then
    return ('sidekick_user', auth_user.id, extract(epoch from (now() + interval '2 days')))::sidekick.jwt_token;
  else
    return null;
  end if;
end;
$$;
-- ddl-end --
ALTER FUNCTION sidekick.authenticate_user_by_username_password(text,text) OWNER TO sidekick_admin;
-- ddl-end --
COMMENT ON FUNCTION sidekick.authenticate_user_by_username_password(text,text) IS E'Creates a JWT token that will securely identify an user and give them certain permissions. This token expires in 2 days.';
-- ddl-end --

-- object: sidekick."current_user" | type: FUNCTION --
-- DROP FUNCTION IF EXISTS sidekick."current_user"() CASCADE;
CREATE FUNCTION sidekick."current_user" ()
	RETURNS sidekick.users
	LANGUAGE sql
	STABLE 
	CALLED ON NULL INPUT
	SECURITY DEFINER
	COST 100
	AS $$
  select *
  from sidekick.users
  where id = nullif(current_setting('jwt.claims.user_id', true), '')::integer
$$;
-- ddl-end --
ALTER FUNCTION sidekick."current_user"() OWNER TO sidekick_admin;
-- ddl-end --
COMMENT ON FUNCTION sidekick."current_user"() IS E'Returns the user who was identified by our JWT.';
-- ddl-end --

-- object: sidekick.register_user_by_email_password | type: FUNCTION --
-- DROP FUNCTION IF EXISTS sidekick.register_user_by_email_password(text,text) CASCADE;
CREATE FUNCTION sidekick.register_user_by_email_password (email text, password text)
	RETURNS sidekick.users
	LANGUAGE plpgsql
	VOLATILE 
	STRICT
	SECURITY DEFINER
	COST 100
	AS $$
declare
  new_user sidekick.users;
begin
  insert into sidekick.users default values
    returning * into new_user;

  insert into sidekick.users_decoration(id, email) values (new_user.id, email);

  insert into sidekick_private.users_password (id, password_hash) values
    (new_user.id, crypt(password, gen_salt('bf')));

  return new_user;
end;
$$;
-- ddl-end --
ALTER FUNCTION sidekick.register_user_by_email_password(text,text) OWNER TO sidekick_admin;
-- ddl-end --
COMMENT ON FUNCTION sidekick.register_user_by_email_password(text,text) IS E'Registers a single user by email and password and returns a sidekick.users. The password will be hashed using the pg function crypt(password, gen_salt("bf"))';
-- ddl-end --

-- object: sidekick.get_foreign_keys | type: FUNCTION --
-- DROP FUNCTION IF EXISTS sidekick.get_foreign_keys() CASCADE;
CREATE FUNCTION sidekick.get_foreign_keys ()
	RETURNS TABLE (table_schema information_schema.sql_identifier, table_name information_schema.sql_identifier, column_name information_schema.sql_identifier)
	LANGUAGE plpgsql
	STABLE 
	CALLED ON NULL INPUT
	SECURITY INVOKER
	COST 100
	ROWS 1000
	AS $$
begin
	return query
    SELECT c.table_schema, c.table_name, c.column_name
    FROM information_schema.key_column_usage AS c
    LEFT JOIN information_schema.table_constraints AS t
    ON t.constraint_name = c.constraint_name
    WHERE  t.constraint_type = 'FOREIGN KEY';
end;
$$;
-- ddl-end --
ALTER FUNCTION sidekick.get_foreign_keys() OWNER TO sidekick_admin;
-- ddl-end --

-- object: sidekick.get_unique_keys | type: FUNCTION --
-- DROP FUNCTION IF EXISTS sidekick.get_unique_keys() CASCADE;
CREATE FUNCTION sidekick.get_unique_keys ()
	RETURNS TABLE (table_schema information_schema.sql_identifier, table_name information_schema.sql_identifier, column_name information_schema.sql_identifier)
	LANGUAGE plpgsql
	STABLE 
	CALLED ON NULL INPUT
	SECURITY INVOKER
	COST 100
	ROWS 1000
	AS $$
begin
	return query
    SELECT c.table_schema, c.table_name, c.column_name
    FROM information_schema.key_column_usage AS c
    LEFT JOIN information_schema.table_constraints AS t
    ON t.constraint_name = c.constraint_name
    WHERE  t.constraint_type = 'UNIQUE KEY';
end;
$$;
-- ddl-end --
ALTER FUNCTION sidekick.get_unique_keys() OWNER TO sidekick_admin;
-- ddl-end --

-- object: sidekick.get_primary_keys | type: FUNCTION --
-- DROP FUNCTION IF EXISTS sidekick.get_primary_keys() CASCADE;
CREATE FUNCTION sidekick.get_primary_keys ()
	RETURNS TABLE (table_schema information_schema.sql_identifier, table_name information_schema.sql_identifier, column_name information_schema.sql_identifier)
	LANGUAGE plpgsql
	STABLE 
	CALLED ON NULL INPUT
	SECURITY INVOKER
	COST 100
	ROWS 1000
	AS $$
begin
	return query
    SELECT c.table_schema, c.table_name, c.column_name
    FROM information_schema.key_column_usage AS c
    LEFT JOIN information_schema.table_constraints AS t
    ON t.constraint_name = c.constraint_name
    WHERE  t.constraint_type = 'PRIMARY KEY';
end;
$$;
-- ddl-end --
ALTER FUNCTION sidekick.get_primary_keys() OWNER TO sidekick_admin;
-- ddl-end --

-- object: update_extensions_updated_at | type: TRIGGER --
-- DROP TRIGGER IF EXISTS update_extensions_updated_at ON sidekick.extensions CASCADE;
CREATE TRIGGER update_extensions_updated_at
	BEFORE UPDATE
	ON sidekick.extensions
	FOR EACH ROW
	EXECUTE PROCEDURE sidekick.updated_at_trigger('');
-- ddl-end --

-- object: update_users_updated_at | type: TRIGGER --
-- DROP TRIGGER IF EXISTS update_users_updated_at ON sidekick.users CASCADE;
CREATE TRIGGER update_users_updated_at
	BEFORE UPDATE
	ON sidekick.users
	FOR EACH ROW
	EXECUTE PROCEDURE sidekick.updated_at_trigger('');
-- ddl-end --

-- object: select_user | type: POLICY --
-- DROP POLICY IF EXISTS select_user ON sidekick.users CASCADE;
CREATE POLICY select_user ON sidekick.users
	AS PERMISSIVE
	FOR SELECT
	TO PUBLIC
	USING (id = NULLIF(current_setting('jwt.claims.user_id'::text, true), ''::text)::integer);
-- ddl-end --

-- object: update_users_decoration_updated_at | type: TRIGGER --
-- DROP TRIGGER IF EXISTS update_users_decoration_updated_at ON sidekick.users_decoration CASCADE;
CREATE TRIGGER update_users_decoration_updated_at
	BEFORE UPDATE
	ON sidekick.users_decoration
	FOR EACH ROW
	EXECUTE PROCEDURE sidekick.updated_at_trigger('');
-- ddl-end --

-- object: select_user_decoration | type: POLICY --
-- DROP POLICY IF EXISTS select_user_decoration ON sidekick.users_decoration CASCADE;
CREATE POLICY select_user_decoration ON sidekick.users_decoration
	AS PERMISSIVE
	FOR SELECT
	TO PUBLIC
	USING (id = NULLIF(current_setting('jwt.claims.user_id'::text, true), ''::text)::integer);
-- ddl-end --

-- object: update_global_updated_at | type: TRIGGER --
-- DROP TRIGGER IF EXISTS update_global_updated_at ON sidekick.global CASCADE;
CREATE TRIGGER update_global_updated_at
	BEFORE UPDATE
	ON sidekick.global
	FOR EACH ROW
	EXECUTE PROCEDURE sidekick.updated_at_trigger('');
-- ddl-end --

-- object: update_routes_updated_at | type: TRIGGER --
-- DROP TRIGGER IF EXISTS update_routes_updated_at ON sidekick.routes CASCADE;
CREATE TRIGGER update_routes_updated_at
	BEFORE UPDATE
	ON sidekick.routes
	FOR EACH ROW
	EXECUTE PROCEDURE sidekick.updated_at_trigger('');
-- ddl-end --

-- object: global_users__id_fkey | type: CONSTRAINT --
-- ALTER TABLE sidekick.global DROP CONSTRAINT IF EXISTS global_users__id_fkey CASCADE;
ALTER TABLE sidekick.global ADD CONSTRAINT global_users__id_fkey FOREIGN KEY (users__id)
REFERENCES sidekick.users (id) MATCH SIMPLE
ON DELETE CASCADE ON UPDATE NO ACTION;
-- ddl-end --

-- object: users_decoration_id_fkey | type: CONSTRAINT --
-- ALTER TABLE sidekick.users_decoration DROP CONSTRAINT IF EXISTS users_decoration_id_fkey CASCADE;
ALTER TABLE sidekick.users_decoration ADD CONSTRAINT users_decoration_id_fkey FOREIGN KEY (id)
REFERENCES sidekick.users (id) MATCH SIMPLE
ON DELETE CASCADE ON UPDATE NO ACTION;
-- ddl-end --

