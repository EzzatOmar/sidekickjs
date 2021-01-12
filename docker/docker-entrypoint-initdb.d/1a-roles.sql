-- CREATES ALL ROLES HERE
CREATE ROLE sidekick_api NOINHERIT;
ALTER ROLE sidekick_api WITH LOGIN PASSWORD 'todoChangeMe';
COMMENT ON ROLE sidekick_api IS E'Standard role for the api to connect with the database. This role should never only be used as an authenticator and switched to a different role to execute SQL.';

CREATE ROLE sidekick_public NOINHERIT;
COMMENT ON ROLE sidekick_public IS E'Role which will be set when authentication was not sucessful.';

CREATE ROLE sidekick_user NOINHERIT;
COMMENT ON ROLE sidekick_user IS E'Role defines standard user which will be set when authentication was sucessful.';

-- GRANT ACCESS
GRANT sidekick_public TO sidekick_api;
GRANT sidekick_user TO sidekick_api;