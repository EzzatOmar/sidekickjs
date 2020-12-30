CREATE SCHEMA IF NOT EXISTS sidekick;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE ROLE sidekick_api NOINHERIT;
CREATE ROLE sidekick_public NOINHERIT;
CREATE ROLE sidekick_user NOINHERIT;

COMMENT ON ROLE sidekick_api IS `Standard role for the api to connect with the database.
This role should never only be used as an authenticator and switched to a different role to execute SQL.`;
COMMENT ON ROLE sidekick_public IS `Role which will be set when authentication was not sucessful.`;
COMMENT ON ROLE sidekick_user IS `Role defines standard user which will be set when authentication was sucessful.`;


GRANT sidekick_public TO sidekick_api;
GRANT sidekick_user TO sidekick_api;

SET SCHEMA 'sidekick';

CREATE OR REPLACE FUNCTION updated_at_trigger()
  RETURNS TRIGGER AS $$
  BEGIN
      NEW.updated_at = now();
      RETURN NEW;
  END;
  $$ language 'plpgsql';