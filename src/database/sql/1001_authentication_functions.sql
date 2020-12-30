-- FUNCTION TO AUTHENTICATE WITH EMAIL AND PASSWORD
create or replace function sidekick.authenticate_user_by_email_password (
  email text,
  password text
) returns sidekick.jwt_token as $$
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
$$ language plpgsql strict security definer;

comment on function sidekick.authenticate_user_by_email_password(text, text) is 'Creates a JWT token that will securely identify an user and give them certain permissions. This token expires in 2 days.';
grant execute on function sidekick.authenticate_user_by_email_password(text, text) to sidekick_public, sidekick_user;

-- FUNCTION TO AUTHENTICATE WITH USERNAME AND PASSWORD
create or replace function sidekick.authenticate_user_by_username_password (
  username text,
  password text
) returns sidekick.jwt_token as $$
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
$$ language plpgsql strict security definer;

comment on function sidekick.authenticate_user_by_username_password(text, text) is 'Creates a JWT token that will securely identify an user and give them certain permissions. This token expires in 2 days.';
grant execute on function sidekick.authenticate_user_by_username_password(text, text) to sidekick_public, sidekick_user;

-- FUNCTION TO GET CURRENT USER
create or replace function sidekick.current_user() returns sidekick.users as $$
  select *
  from sidekick.users
  where id = nullif(current_setting('jwt.claims.user_id', true), '')::integer
$$ language sql stable security definer;

comment on function sidekick.current_user() is 'Returns the user who was identified by our JWT.';
grant execute on function sidekick.current_user() to sidekick_public, sidekick_user;