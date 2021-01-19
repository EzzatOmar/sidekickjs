-- CREATES SCHEMAS
CREATE SCHEMA sidekick;
ALTER SCHEMA sidekick OWNER TO sidekick_admin;
COMMENT ON SCHEMA sidekick IS E'Tables and views should not be visible from the outside.';

CREATE SCHEMA sidekick_private;
ALTER SCHEMA sidekick_private OWNER TO sidekick_admin;
COMMENT ON SCHEMA sidekick_private IS E'Tables and views must not be visible or accessible from any user except sidekick_admin. Only function with the securiy definer are allowed to be executed outside the sidekick_admin role.';

-- GRANT ACCESS
GRANT USAGE ON SCHEMA sidekick TO sidekick_api, sidekick_public, sidekick_user;

-- NOTE: schema sidekick_private is only accessible by sidekick_admin