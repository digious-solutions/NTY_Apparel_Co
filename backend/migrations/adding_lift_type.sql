-- ✅ Add lift_type column to bench_club_members if not exists
ALTER TABLE bench_club_members 
ADD COLUMN lift_type VARCHAR(50) DEFAULT 'Bench Press' AFTER email;

-- ✅ Update existing records to Bench Press
UPDATE bench_club_members SET lift_type = 'Bench Press' WHERE lift_type IS NULL;