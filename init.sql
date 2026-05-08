CREATE TABLE IF NOT EXISTS verified_phone_numbers (
  id SERIAL PRIMARY KEY,
  phone_hash VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_phone_hash ON verified_phone_numbers(phone_hash);