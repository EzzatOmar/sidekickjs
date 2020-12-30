CREATE OR REPLACE FUNCTION sidekick.register_user_by_email_password(
  email text,
  password text
) returns sidekick.users as $$
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
$$ language plpgsql strict security definer;

COMMENT ON FUNCTION sidekick.register_user_by_email_password(text, text) IS 'Registers a single user by email and password and returns a sidekick.users. The password will be hashed using the pg function crypt(password, gen_salt("bf"))';
GRANT EXECUTE ON FUNCTION sidekick.register_user_by_email_password TO sidekick_public;