-- CREATE FUNCTIONS

-- after schema creation and before function creation
alter default privileges revoke execute on functions from public;

---- CREATE sidekick.authenticate_user_by_email_password
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
  inner join sidekick_private.users_password up on ud.uuid = up.uuid
  where ud.email = $1 AND ud.email is not null;

  if auth_user.password_hash = crypt(password, auth_user.password_hash) then
    return ('sidekick_user', auth_user.uuid, extract(epoch from (now() + interval '2 days')))::sidekick.jwt_token;
  else
    return null;
  end if;
end;
$$;
ALTER FUNCTION sidekick.authenticate_user_by_email_password(text,text) OWNER TO sidekick_admin;
COMMENT ON FUNCTION sidekick.authenticate_user_by_email_password(text,text) IS E'Creates a JWT token that will securely identify an user and give them certain permissions. This token expires in 2 days.';

---- CREATE sidekick.authenticate_user_by_username_password
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
  inner join sidekick_private.users_password up on ud.uuid = up.uuid
  where ud.username = $1 AND ud.username is not null;

  if auth_user.password_hash = crypt(password, auth_user.password_hash) then
    return ('sidekick_user', auth_user.uuid, extract(epoch from (now() + interval '2 days')))::sidekick.jwt_token;
  else
    return null;
  end if;
end;
$$;
ALTER FUNCTION sidekick.authenticate_user_by_username_password(text,text) OWNER TO sidekick_admin;
COMMENT ON FUNCTION sidekick.authenticate_user_by_username_password(text,text) IS E'Creates a JWT token that will securely identify an user and give them certain permissions. This token expires in 2 days.';

---- CREATE sidekick.current_user_uuid
create function sidekick.current_user_uuid() returns UUID  as $$
  select nullif(current_setting('jwt.claims.user_uuid', true), '')::UUID;
$$ language sql stable security definer;

ALTER FUNCTION sidekick."current_user_uuid"() OWNER TO sidekick_admin;
COMMENT ON FUNCTION sidekick."current_user_uuid"() IS E'Returns the user iuud as int who was identified by our JWT.';


---- CREATE sidekick.current_user
CREATE FUNCTION sidekick.current_user ()
	RETURNS sidekick.users
	LANGUAGE sql
	STABLE 
	CALLED ON NULL INPUT
	SECURITY DEFINER
	COST 100
	AS $$
  select *
  from sidekick.users
  where uuid = nullif(current_setting('jwt.claims.user_uuid', true), '')::UUID
$$;
ALTER FUNCTION sidekick."current_user"() OWNER TO sidekick_admin;
COMMENT ON FUNCTION sidekick."current_user"() IS E'Returns the user who was identified by our JWT.';

---- CREATE sidekick.get_foreign_keys
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
ALTER FUNCTION sidekick.get_foreign_keys() OWNER TO sidekick_admin;

---- CREATE sidekick.get_primary_keys
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

---- CREATE sidekick.get_unique_keys
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
ALTER FUNCTION sidekick.get_unique_keys() OWNER TO sidekick_admin;

---- CREATE sidekick.register_user_by_email_password
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

  insert into sidekick.users_decoration(id, email) values (new_user.uuid, email);

  insert into sidekick_private.users_password (uuid, password_hash) values
    (new_user.id, crypt(password, gen_salt('bf')));

  return new_user;
end;
$$;
ALTER FUNCTION sidekick.register_user_by_email_password(text,text) OWNER TO sidekick_admin;
COMMENT ON FUNCTION sidekick.register_user_by_email_password(text,text) IS E'Registers a single user by email and password and returns a sidekick.users. The password will be hashed using the pg function crypt(password, gen_salt("bf"))';

---- CREATE sidekick.register_user_by_password
CREATE FUNCTION sidekick.register_user_by_password (blocked boolean, password text)
	RETURNS sidekick.users
	LANGUAGE plpgsql
	VOLATILE 
	STRICT
	SECURITY DEFINER
	COST 100
	AS $$
 declare new_user sidekick.users; begin insert into sidekick.users (blocked) values (blocked) returning * into new_user;
insert into sidekick_private.users_password (id, password_hash) values (new_user.uuid, crypt(password, gen_salt('bf')));
return new_user; end; 
$$;
ALTER FUNCTION sidekick.register_user_by_password(boolean,text) OWNER TO sidekick_admin;
COMMENT ON FUNCTION sidekick.register_user_by_password(boolean,text) IS E'Registers a single user by password and returns a sidekick.users. First argument is a boolean telling if the user should be marked as blocked. The Secound argurmen it the password in plain text. The password will be hashed using the pg function crypt(password, gen_salt("bf"))';

---- CREATE sidekick.updated_at_trigger
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
ALTER FUNCTION sidekick.updated_at_trigger() OWNER TO sidekick_admin;
COMMENT ON FUNCTION sidekick.updated_at_trigger() IS E'Updates the update_at column with the current timestamptz.';

---- CREATE sidekick_private.updated_at_trigger
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
ALTER FUNCTION sidekick_private.updated_at_trigger() OWNER TO sidekick_admin;
COMMENT ON FUNCTION sidekick_private.updated_at_trigger() IS E'Updates the update_at column with the current timestamptz.';
