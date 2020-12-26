CREATE SCHEMA IF NOT EXISTS sidekick;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE ROLE sidekick_api;

SET SCHEMA 'sidekick';

CREATE OR REPLACE FUNCTION updated_at_trigger()
  RETURNS TRIGGER AS $$
  BEGIN
      NEW.updated_at = now();
      RETURN NEW;
  END;
  $$ language 'plpgsql';