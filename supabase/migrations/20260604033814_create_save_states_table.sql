/*
  # Create Save States Table

  1. New Tables
    - `save_states`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `game_id` (text, identifier of the game)
      - `console_id` (text, identifier of console)
      - `slot_number` (integer, save slot)
      - `file_data` (bytea, binary save state data)
      - `file_size` (integer, size in bytes)
      - `screenshot_path` (text, optional path to screenshot)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `cloud_synced` (boolean, sync status)

  2. Security
    - Enable RLS on `save_states` table
    - Add policy for users to manage their own save states

  3. Indexes
    - Index on user_id for fast lookups
    - Index on console_id + game_id for filtering
*/

CREATE TABLE IF NOT EXISTS save_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id text NOT NULL,
  console_id text NOT NULL,
  slot_number integer NOT NULL DEFAULT 0,
  file_data bytea NOT NULL,
  file_size integer NOT NULL,
  screenshot_path text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  cloud_synced boolean DEFAULT false
);

ALTER TABLE save_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own save states"
  ON save_states
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_save_states_user_id ON save_states(user_id);
CREATE INDEX idx_save_states_game_console ON save_states(console_id, game_id);
CREATE INDEX idx_save_states_slot ON save_states(user_id, slot_number);

-- Create table for user preferences and cloud sync settings
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  cloud_sync_enabled boolean DEFAULT false,
  auto_backup_interval integer DEFAULT 3600,
  theme text DEFAULT 'dark',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings"
  ON user_settings
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
