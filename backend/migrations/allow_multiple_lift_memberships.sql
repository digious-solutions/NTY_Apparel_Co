-- Allow one user to hold the same verified tier in different lift clubs.
ALTER TABLE bench_club_members
  DROP INDEX idx_email_tier,
  DROP INDEX idx_user_tier,
  ADD UNIQUE INDEX idx_email_weight_lift (email, weight_tier, lift_type),
  ADD UNIQUE INDEX idx_user_weight_lift (user_id, weight_tier, lift_type);
