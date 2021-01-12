---- GRANT PERMISSIONS

-- FOR ACCESS CONTROL
grant execute on function sidekick.register_user_by_email_password (email text, password text) to sidekick_public;
grant execute on function sidekick.register_user_by_password (blocked boolean, password text) to sidekick_public;

grant execute on function sidekick.authenticate_user_by_email_password (text, text) to sidekick_public, sidekick_user;
grant execute on function sidekick.authenticate_user_by_username_password (username text, password text) to sidekick_public, sidekick_user;

grant usage on schema sidekick to sidekick_public, sidekick_user;