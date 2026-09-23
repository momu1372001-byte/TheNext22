/*
# Create user_profiles table for per-user app settings

1. New Tables
- `user_profiles`
  - `id` (uuid, primary key, references auth.users) — one row per user
  - `level` (text, nullable) — CEFR level code (A1–C1) selected during onboarding
  - `daily_goal` (int, default 10) — daily word learning goal
  - `onboarding_completed` (boolean, default false) — whether the user finished onboarding
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

2. Security
- Enable RLS on `user_profiles`.
- Owner-scoped CRUD: each authenticated user can only read/insert/update their own row.
- No DELETE policy — profile rows are managed by the system and should not be deleted by the client.

3. Important Notes
- `id` defaults to `auth.uid()` so inserts from the client work without explicitly passing the user ID.
- The `upsert` pattern is used from the frontend: on first onboarding completion, the client upserts the profile row.
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  level text,
  daily_goal int NOT NULL DEFAULT 10,
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON user_profiles;
CREATE POLICY "select_own_profile"
ON user_profiles FOR SELECT
TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON user_profiles;
CREATE POLICY "insert_own_profile"
ON user_profiles FOR INSERT
TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
CREATE POLICY "update_own_profile"
ON user_profiles FOR UPDATE
TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
