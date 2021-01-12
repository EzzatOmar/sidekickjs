---- CREATE TRIGGERS

-- object: update_users_updated_at | type: TRIGGER --
CREATE TRIGGER update_users_updated_at
	BEFORE UPDATE
	ON sidekick.users
	FOR EACH ROW
	EXECUTE PROCEDURE sidekick.updated_at_trigger('');

-- object: update_users_decoration_updated_at | type: TRIGGER --
CREATE TRIGGER update_users_decoration_updated_at
	BEFORE UPDATE
	ON sidekick.users_decoration
	FOR EACH ROW
	EXECUTE PROCEDURE sidekick.updated_at_trigger('');

-- object: update_global_updated_at | type: TRIGGER --
CREATE TRIGGER update_global_updated_at
	BEFORE UPDATE
	ON sidekick.global
	FOR EACH ROW
	EXECUTE PROCEDURE sidekick.updated_at_trigger('');

-- object: update_users_password_updated_at | type: TRIGGER --
CREATE TRIGGER update_users_password_updated_at
	BEFORE UPDATE
	ON sidekick_private.users_password
	FOR EACH ROW
	EXECUTE PROCEDURE sidekick_private.updated_at_trigger('');