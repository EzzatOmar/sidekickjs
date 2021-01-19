CREATE SCHEMA IF NOT EXISTS sidekick;
CREATE SCHEMA IF NOT EXISTS sidekick_private;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE ROLE sidekick_api NOINHERIT;
CREATE ROLE sidekick_public NOINHERIT;
CREATE ROLE sidekick_user NOINHERIT;

COMMENT ON SCHEMA sidekick IS 'Tables and views should not be visible from the outside.';
COMMENT ON SCHEMA sidekick_private IS 'Tables and views must not be visible or accessible from any user except sidekick_admin. Only function with the securiy definer are allowed to be executed outside the sidekick_admin role.';

COMMENT ON ROLE sidekick_api IS 'Standard role for the api to connect with the database. This role should never only be used as an authenticator and switched to a different role to execute SQL.';
COMMENT ON ROLE sidekick_public IS 'Role which will be set when authentication was not sucessful.';
COMMENT ON ROLE sidekick_user IS 'Role defines standard user which will be set when authentication was sucessful.';


GRANT sidekick_public TO sidekick_api;
GRANT sidekick_user TO sidekick_api;
GRANT USAGE ON SCHEMA sidekick TO sidekick_api, sidekick_public, sidekick_user;


SET SCHEMA 'sidekick';

CREATE OR REPLACE FUNCTION updated_at_trigger()
  RETURNS TRIGGER AS $$
  BEGIN
      NEW.updated_at = now();
      RETURN NEW;
  END;
  $$ language 'plpgsql';

SET SCHEMA 'sidekick_private';

CREATE OR REPLACE FUNCTION updated_at_trigger()
  RETURNS TRIGGER AS $$
  BEGIN
      NEW.updated_at = now();
      RETURN NEW;
  END;
  $$ language 'plpgsql';


  --- CREATE HELPER FUNCTIONS IN SIDEKICK SCHEMA
CREATE OR REPLACE FUNCTION sidekick.get_primary_keys() 
returns table(table_schema information_schema.sql_identifier,
              table_name information_schema.sql_identifier,
              column_name information_schema.sql_identifier)
              language plpgsql STABLE as $$
begin
	return query
    SELECT c.table_schema, c.table_name, c.column_name
    FROM information_schema.key_column_usage AS c
    LEFT JOIN information_schema.table_constraints AS t
    ON t.constraint_name = c.constraint_name
    WHERE  t.constraint_type = 'PRIMARY KEY';
end;
$$;

CREATE OR REPLACE FUNCTION sidekick.get_foreign_keys() 
returns table(table_schema information_schema.sql_identifier,
              table_name information_schema.sql_identifier,
              column_name information_schema.sql_identifier)
              language plpgsql STABLE as $$
begin
	return query
    SELECT c.table_schema, c.table_name, c.column_name
    FROM information_schema.key_column_usage AS c
    LEFT JOIN information_schema.table_constraints AS t
    ON t.constraint_name = c.constraint_name
    WHERE  t.constraint_type = 'FOREIGN KEY';
end;
$$;

CREATE OR REPLACE FUNCTION sidekick.get_unique_keys() 
returns table(table_schema information_schema.sql_identifier,
              table_name information_schema.sql_identifier,
              column_name information_schema.sql_identifier)
              language plpgsql STABLE as $$
begin
	return query
    SELECT c.table_schema, c.table_name, c.column_name
    FROM information_schema.key_column_usage AS c
    LEFT JOIN information_schema.table_constraints AS t
    ON t.constraint_name = c.constraint_name
    WHERE  t.constraint_type = 'UNIQUE KEY';
end;
$$;
  --- END HELPER FUNCTIONS

