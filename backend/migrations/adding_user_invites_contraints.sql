-- ✅ Add UNIQUE constraint on email to prevent duplicates
ALTER TABLE user_invites ADD UNIQUE INDEX idx_email_unique (email);

