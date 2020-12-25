const create_stmt = `
CREATE TABLE IF NOT EXISTS users (
  uuid UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  blocked BOOLEAN NOT NULL DEFAULT FALSE
  );
`;

