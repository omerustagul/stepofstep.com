-- Upgrade wheel_rewards table to support specialized reward types and commands
ALTER TABLE wheel_rewards
ADD COLUMN IF NOT EXISTS reward_type VARCHAR(50) DEFAULT 'text' CHECK (reward_type IN ('text', 'membership', 'discount', 'file')),
ADD COLUMN IF NOT EXISTS reward_value TEXT,
ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Index for better performance when querying prizes by type
CREATE INDEX IF NOT EXISTS idx_wheel_rewards_type ON wheel_rewards(reward_type);

COMMENT ON COLUMN wheel_rewards.reward_type IS 'Type of the reward: text (standard), membership (plan upgrade), discount (percentage), file (downloadable asset)';
COMMENT ON COLUMN wheel_rewards.reward_value IS 'Generic value field (e.g., plan slug for membership, discount percentage, or just extra info)';
COMMENT ON COLUMN wheel_rewards.file_url IS 'URL to the downloadable file in Supabase Storage if reward_type is file';
