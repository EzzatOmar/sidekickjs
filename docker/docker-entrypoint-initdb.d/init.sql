CREATE SCHEMA IF NOT EXISTS sidekick;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE ROLE sidekick_api NOINHERIT;
CREATE ROLE sidekick_public NOINHERIT;
CREATE ROLE sidekick_user NOINHERIT;

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