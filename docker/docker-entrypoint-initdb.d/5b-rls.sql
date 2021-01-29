---- ROW LEVEL SECURITY

-- TABLE users
create policy read_users on sidekick.users for select using (uuid = sidekick.current_user_uuid());

-- TABLE users_decoration
create policy read_users_decoration on sidekick.users_decoration for select using (uuid = sidekick.current_user_uuid());

-- TABLE global
create policy read_global on sidekick.global for select using (user_uuid = sidekick.current_user_uuid());