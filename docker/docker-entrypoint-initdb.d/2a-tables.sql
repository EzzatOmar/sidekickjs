-- CREATE TABLES

---- CREATE sidekick.users
CREATE TABLE sidekick.users (
	uuid UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
	created_at timestamp with time zone NOT NULL DEFAULT now(),
	updated_at timestamp with time zone NOT NULL DEFAULT now(),
	blocked boolean NOT NULL DEFAULT false
);
ALTER TABLE sidekick.users OWNER TO sidekick_admin;
ALTER TABLE sidekick.users ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE sidekick.users IS E'Base User Identity. If the user is **blocked** no REST or GraphQL actions can be performed.   User concept will be extended by other tables. Usually going by the nameing convention users__<decoration> with references via users__id';
COMMENT ON COLUMN sidekick.users.uuid IS E'Auto incremental integer';
COMMENT ON COLUMN sidekick.users.created_at IS E'Timestamp when the user was created';
COMMENT ON COLUMN sidekick.users.updated_at IS E'Timestamp when the last modification has happend';
COMMENT ON COLUMN sidekick.users.blocked IS E'Boolean';

---- CREATE sidekick.users_decoration
CREATE TABLE sidekick.users_decoration (
	uuid UUID NOT NULL,
	created_at timestamp with time zone NOT NULL DEFAULT now(),
	updated_at timestamp with time zone NOT NULL DEFAULT now(),
	username text,
	email text,
	email_verified boolean DEFAULT false,
	CONSTRAINT users_decoration_username_check CHECK ((char_length(username) >= 3)),
	CONSTRAINT users_decoration_email_check CHECK ((email ~* '^.+@.+\..+$'::text)),
	CONSTRAINT users_decoration_pkey PRIMARY KEY (uuid),
	CONSTRAINT users_decoration_username_key UNIQUE (username),
	CONSTRAINT users_decoration_email_key UNIQUE (email)
);
ALTER TABLE sidekick.users_decoration ADD CONSTRAINT users_decoration_id_fkey FOREIGN KEY (uuid)
	REFERENCES sidekick.users (uuid) MATCH SIMPLE
	ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE sidekick.users_decoration OWNER TO sidekick_admin;
ALTER TABLE sidekick.users_decoration ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE sidekick.users_decoration IS E'Extends the base User Identity. Introduces username and email';
COMMENT ON COLUMN sidekick.users_decoration.uuid IS E'Auto generated uuid';
COMMENT ON COLUMN sidekick.users_decoration.created_at IS E'Timestamp when the user was created';
COMMENT ON COLUMN sidekick.users_decoration.updated_at IS E'Timestamp when the last modification has happend';
COMMENT ON COLUMN sidekick.users_decoration.username IS E'Text must be at least 6 characters long';
COMMENT ON COLUMN sidekick.users_decoration.email IS E'Text must include a single @ symbol';
COMMENT ON COLUMN sidekick.users_decoration.email_verified IS E'This should only be set to true after the email address was verified by an external process.';

---- CREATE sidekick.global
CREATE TABLE sidekick.global (
	id serial NOT NULL,
	created_at timestamp with time zone NOT NULL DEFAULT now(),
	updated_at timestamp with time zone NOT NULL DEFAULT now(),
	user_uuid UUID,
	key text NOT NULL,
	val_bool boolean,
	val_text text,
	val_int integer,
	CONSTRAINT val_not_null CHECK (((val_bool IS NOT NULL) OR (val_text IS NOT NULL) OR (val_int IS NOT NULL))),
	CONSTRAINT global_pkey PRIMARY KEY (id),
	CONSTRAINT global_key_key UNIQUE (key)
);
ALTER TABLE sidekick.global 
	ADD CONSTRAINT global_user_uuid_fkey FOREIGN KEY (user_uuid)
	REFERENCES sidekick.users (uuid) MATCH SIMPLE
	ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE sidekick.global OWNER TO sidekick_admin;
ALTER TABLE sidekick.global ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE sidekick.global IS E'Stores global state in the database. Value must be bool, text or int.';
COMMENT ON COLUMN sidekick.global.id IS E'Auto generated uuid';
COMMENT ON COLUMN sidekick.global.created_at IS E'Timestamp when the user was created';
COMMENT ON COLUMN sidekick.global.updated_at IS E'Timestamp when the last modification has happend';
COMMENT ON COLUMN sidekick.global.user_uuid IS E'References pk uuid from the users table';
COMMENT ON COLUMN sidekick.global.key IS E'Unique key to get value';
COMMENT ON COLUMN sidekick.global.val_bool IS E'Boolean, true or false';
COMMENT ON COLUMN sidekick.global.val_text IS E'Text';
COMMENT ON COLUMN sidekick.global.val_int IS E'Integer';

---- CREATE sidekick_private.users_password
CREATE TABLE sidekick_private.users_password (
	uuid UUID NOT NULL,
	created_at timestamp with time zone NOT NULL DEFAULT now(),
	updated_at timestamp with time zone NOT NULL DEFAULT now(),
	password_hash character(60),
	password_recovery_code uuid,
	password_recovery_code_updated_at timestamp,
	CONSTRAINT users_password_pkey PRIMARY KEY (uuid)
);

ALTER TABLE sidekick_private.users_password
	ADD CONSTRAINT users_password_uuid_fkey FOREIGN KEY (uuid)
	REFERENCES sidekick.users (uuid) MATCH SIMPLE
	ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE sidekick_private.users_password OWNER TO sidekick_admin;

COMMENT ON TABLE sidekick_private.users_password IS E'Extends the base user table by the concept of passwords. Each password is stored as a hash and can have a recovery code. It is possible to have multiple passwords per user.';
COMMENT ON COLUMN sidekick_private.users_password.uuid IS E'References the uuid from table users.';
COMMENT ON COLUMN sidekick_private.users_password.created_at IS E'Timestamp when the user was created,';
COMMENT ON COLUMN sidekick_private.users_password.updated_at IS E'Timestamp when the last modification has happend,';
COMMENT ON COLUMN sidekick_private.users_password.password_hash IS E'Hash value 60 character in length,';
COMMENT ON COLUMN sidekick_private.users_password.password_recovery_code IS E'An uuid which will should always be null unless a recovery has been issued.';
COMMENT ON COLUMN sidekick_private.users_password.password_recovery_code_updated_at IS E'Timestamp when the recovery uuid was last updated,';

