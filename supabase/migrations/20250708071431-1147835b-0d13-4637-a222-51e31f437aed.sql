-- Drop foreign key constraint that's causing issues for demo users
ALTER TABLE notification_preferences DROP CONSTRAINT IF EXISTS notification_preferences_user_id_fkey;

-- Also drop the trigger that auto-creates notification preferences
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;