---- ROW LEVEL SECURITY

-- TABLE users
create policy read_users on sidekick.users for select using (id = sidekick.current_user_id());

-- TABLE users_decoration
create policy read_users_decoration on sidekick.users_decoration for select using (id = sidekick.current_user_id());

-- TABLE global
create policy read_global on sidekick.global for select using (id = sidekick.current_user_id());